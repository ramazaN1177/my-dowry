import { Request, Response } from "express";
import { AppDataSource } from '../db/connectDB';
import { User } from "../entities/user.entity";
import { Category } from "../entities/category.entity";
import { Purchase } from "../entities/purchase.entity";
import { BillingServiceClient } from '../services/billing-service.client';

interface AuthRequest extends Request {
    userId?: string;
}

// Paket tipleri
export enum PackageType {
    ADS_DISABLE = 'ads_disable',           // Sadece reklamları kapat
    CATEGORY_LIMIT = 'category_limit'      // Kategori limitini artır (5'er 5'er)
}

const billingServiceClient = new BillingServiceClient();

/**
 * Geri ödeme durumunda paketi geri al
 * purchaseState = 1 (Canceled) olduğunda çağrılacak
 */
const revokePackage = async (userId: string, packageType: PackageType) => {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) return;

    switch (packageType) {
        case PackageType.ADS_DISABLE:
            // Reklamları tekrar aç
            user.adsDisabled = false;
            user.adsDisabledExpiresAt = null;
            break;

        case PackageType.CATEGORY_LIMIT:
            // Kategori limitini 5 azalt (minimum 5 olmalı)
            user.categoryLimit = Math.max(5, user.categoryLimit - 5);
            break;
    }

    await userRepository.save(user);
};

/**
 * Google Play Store ödeme doğrulama ve paket aktivasyonu
 * POST /api/payment/verify
 */
export const verifyPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { packageName, productId, purchaseToken, packageType } = req.body;

        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        // Validasyon
        if (!packageName || !productId || !purchaseToken || !packageType) {
            res.status(400).json({
                success: false,
                message: "Missing required fields: packageName, productId, purchaseToken, packageType"
            });
            return;
        }

        // Package type kontrolü
        if (!Object.values(PackageType).includes(packageType)) {
            res.status(400).json({
                success: false,
                message: `Invalid package type. Must be one of: ${Object.values(PackageType).join(', ')}`
            });
            return;
        }

        // Billing service üzerinden purchase'ı doğrula
        // Artık subscription yok, tüm ürünler tek seferlik (one-time purchase)
        const isSubscription = false;
        const verification = await billingServiceClient.verifyPurchase(
            packageName,
            productId,
            purchaseToken,
            isSubscription
        );

        if (!verification.valid) {
            res.status(400).json({
                success: false,
                message: "Invalid purchase token",
                error: verification.error
            });
            return;
        }

        // Purchase state kontrolü (geri ödeme/iptal kontrolü)
        const purchaseState = verification.purchase?.purchaseState;
        // purchaseState değerleri:
        // 0 = Purchased (satın alınmış - normal)
        // 1 = Canceled (iptal edilmiş - geri ödeme yapılmış)
        // 2 = Pending (beklemede)

        if (purchaseState !== undefined && purchaseState !== 0) {
            // Purchase iptal edilmiş veya beklemede
            if (purchaseState === 1) {
                // Geri ödeme/iptal durumu
                res.status(400).json({
                    success: false,
                    message: "This purchase has been canceled/refunded",
                    error: "Purchase canceled"
                });
                return;
            } else if (purchaseState === 2) {
                // Beklemede durumu
                res.status(400).json({
                    success: false,
                    message: "Purchase is pending",
                    error: "Purchase pending"
                });
                return;
            }
        }

        // Kullanıcıyı al
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: req.userId } });

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        // Token'ın daha önce kullanılıp kullanılmadığını kontrol et
        const purchaseRepository = AppDataSource.getRepository(Purchase);
        const existingPurchase = await purchaseRepository.findOne({
            where: { purchaseToken: purchaseToken }
        });

        if (existingPurchase) {
            // Token zaten kullanılmış
            if (existingPurchase.userId === req.userId) {
                // Aynı kullanıcı tarafından tekrar kullanılmaya çalışılıyor
                res.status(400).json({
                    success: false,
                    message: "This purchase token has already been used",
                    error: "Purchase token already consumed"
                });
                return;
            }
            // Farklı kullanıcı tarafından kullanılmış - ama aynı Google Play hesabı olabilir
            // OrderId'ye göre kontrol et (aynı orderId = aynı Google Play satın alma)
            if (verification.purchase?.orderId && existingPurchase.orderId === verification.purchase.orderId) {
                // Aynı orderId - aynı Google Play satın alma, farklı kullanıcı kullanmaya çalışıyor
                // Bu durumda yeni bir purchase kaydı oluştur (aynı Google Play hesabından gelen satın alma)
                // Ama önce mevcut kullanıcının bu orderId'yi kullanıp kullanmadığını kontrol et
                const userExistingPurchase = await purchaseRepository.findOne({
                    where: { 
                        userId: req.userId,
                        orderId: verification.purchase.orderId
                    }
                });
                
                if (userExistingPurchase) {
                    // Bu kullanıcı zaten bu orderId'yi kullanmış
                    res.status(400).json({
                        success: false,
                        message: "This purchase has already been used by you",
                        error: "Purchase already consumed"
                    });
                    return;
                }
                // Aynı orderId ama farklı kullanıcı - yeni purchase kaydı oluştur (aynı Google Play hesabı)
            } else {
                // Farklı orderId veya orderId yok - farklı satın alma, token zaten kullanılmış
                res.status(400).json({
                    success: false,
                    message: "This purchase token has already been used by another user",
                    error: "Purchase token already consumed"
                });
                return;
            }
        }

        // Paket tipine göre kullanıcıyı güncelle
        let updateMessage = '';
        const now = new Date();

        // Not: adsDisabled kontrolü frontend'de yapılıyor (profile.tsx)
        // Consumable davranışı için backend kontrolü gereksiz
        // Eğer adsDisabled false yapılırsa, kullanıcı tekrar satın alabilir

        switch (packageType) {
            case PackageType.ADS_DISABLE:
                // Sadece reklamları kapat (kalıcı)
                user.adsDisabled = true;
                user.adsDisabledExpiresAt = null; // Kalıcı
                updateMessage = "Ads disabled successfully";
                break;

            case PackageType.CATEGORY_LIMIT:
                // Kategori limitini 5 artır
                user.categoryLimit += 5;
                updateMessage = `Category limit increased to ${user.categoryLimit}`;
                break;
        }

        await userRepository.save(user);

        // Purchase kaydını oluştur (token'ın tekrar kullanılmasını önlemek için)
        const purchase = purchaseRepository.create({
            userId: req.userId,
            purchaseToken: purchaseToken,
            packageName: packageName,
            productId: productId,
            packageType: packageType,
            orderId: verification.purchase?.orderId || null,
            purchaseTimeMillis: verification.purchase?.purchaseTimeMillis || null,
            purchaseState: verification.purchase?.purchaseState || null,
            isSubscription: isSubscription
        });
        await purchaseRepository.save(purchase);

        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: updateMessage,
            purchase: verification.purchase,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};

/**
 * Kullanıcının mevcut paket durumunu getir
 * GET /api/payment/status
 */
export const getPaymentStatus = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const userRepository = AppDataSource.getRepository(User);
        const categoryRepository = AppDataSource.getRepository(Category);
        const user = await userRepository.findOne({ where: { id: req.userId } });

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        // Mevcut kategori sayısını al
        const currentCategoryCount = await categoryRepository.count({ 
            where: { userId: req.userId } 
        });

        // Ads disabled durumunu kontrol et
        const isAdsDisabled = user.adsDisabled && 
            (user.adsDisabledExpiresAt === null || user.adsDisabledExpiresAt > new Date());

        // Eğer expiry time geçmişse, otomatik olarak false yap
        if (user.adsDisabledExpiresAt && user.adsDisabledExpiresAt <= new Date() && user.adsDisabled) {
            user.adsDisabled = false;
            await userRepository.save(user);
        }

        res.status(200).json({
            success: true,
            status: {
                adsDisabled: isAdsDisabled,
                adsDisabledExpiresAt: user.adsDisabledExpiresAt,
                categoryLimit: user.categoryLimit,
                currentCategoryCount: currentCategoryCount
            }
        });

    } catch (error) {
        console.error('Get Payment Status Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};

/**
 * Purchase'ı iptal et veya geri ödeme yap
 * POST /api/payment/revoke (manuel geri alma için)
 */
export const revokePayment = async (req: AuthRequest, res: Response) => {
    try {
        const { purchaseToken } = req.body;

        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        if (!purchaseToken) {
            res.status(400).json({
                success: false,
                message: "Missing required field: purchaseToken"
            });
            return;
        }

        const purchaseRepository = AppDataSource.getRepository(Purchase);
        const purchase = await purchaseRepository.findOne({
            where: { purchaseToken, userId: req.userId }
        });

        if (!purchase) {
            res.status(404).json({
                success: false,
                message: "Purchase not found"
            });
            return;
        }

        // Paketi geri al
        await revokePackage(req.userId, purchase.packageType as PackageType);

        // Purchase kaydını iptal olarak işaretle
        purchase.purchaseState = 1; // Canceled
        await purchaseRepository.save(purchase);

        res.status(200).json({
            success: true,
            message: "Package revoked successfully"
        });
    } catch (error) {
        console.error('Revoke Payment Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};
