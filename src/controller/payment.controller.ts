import { Request, Response } from "express";
import { AppDataSource } from '../db/connectDB';
import { User } from "../entities/user.entity";
import { Category } from "../entities/category.entity";
import { GooglePlayBillingService } from '../services/google-play-billing.service';

interface AuthRequest extends Request {
    userId?: string;
}

// Paket tipleri
export enum PackageType {
    ADS_DISABLE = 'ads_disable',           // Sadece reklamları kapat
    CATEGORY_LIMIT = 'category_limit',      // Kategori limitini artır (5'er 5'er)
    PREMIUM = 'premium'                     // Premium: 10 kategori + reklam kapama
}

const googlePlayService = new GooglePlayBillingService();

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

        // Google Play'den purchase'ı doğrula
        // Subscription olup olmadığını kontrol et (premium genelde subscription)
        const isSubscription = packageType === PackageType.PREMIUM;
        const verification = await googlePlayService.verifyPurchase(
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
        // (Bu kısım için ayrı bir Purchase entity oluşturulabilir)
        // Şimdilik basit bir kontrol yapıyoruz

        // Paket tipine göre kullanıcıyı güncelle
        let updateMessage = '';
        const now = new Date();

        switch (packageType) {
            case PackageType.ADS_DISABLE:
                // Sadece reklamları kapat
                user.adsDisabled = true;
                // Subscription ise expiry time'ı ayarla, değilse null (kalıcı)
                if (isSubscription && verification.purchase?.expiryTimeMillis) {
                    user.adsDisabledExpiresAt = new Date(verification.purchase.expiryTimeMillis);
                } else {
                    user.adsDisabledExpiresAt = null; // Kalıcı
                }
                updateMessage = "Ads disabled successfully";
                break;

            case PackageType.CATEGORY_LIMIT:
                // Kategori limitini 5 artır
                user.categoryLimit += 5;
                updateMessage = `Category limit increased to ${user.categoryLimit}`;
                break;

            case PackageType.PREMIUM:
                // Premium: 10 kategori + reklam kapama
                user.isPremium = true;
                user.adsDisabled = true;
                user.categoryLimit = 10;
                if (verification.purchase?.expiryTimeMillis) {
                    user.premiumExpiresAt = new Date(verification.purchase.expiryTimeMillis);
                    user.adsDisabledExpiresAt = new Date(verification.purchase.expiryTimeMillis);
                } else {
                    user.premiumExpiresAt = null;
                    user.adsDisabledExpiresAt = null;
                }
                updateMessage = "Premium package activated successfully";
                break;
        }

        await userRepository.save(user);

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

        // Premium durumunu kontrol et (expiry time varsa kontrol et)
        const isPremiumActive = user.isPremium && 
            (user.premiumExpiresAt === null || user.premiumExpiresAt > new Date());

        // Ads disabled durumunu kontrol et
        const isAdsDisabled = user.adsDisabled && 
            (user.adsDisabledExpiresAt === null || user.adsDisabledExpiresAt > new Date());

        // Eğer expiry time geçmişse, otomatik olarak false yap
        if (user.premiumExpiresAt && user.premiumExpiresAt <= new Date() && user.isPremium) {
            user.isPremium = false;
            await userRepository.save(user);
        }

        if (user.adsDisabledExpiresAt && user.adsDisabledExpiresAt <= new Date() && user.adsDisabled) {
            user.adsDisabled = false;
            await userRepository.save(user);
        }

        res.status(200).json({
            success: true,
            status: {
                isPremium: isPremiumActive,
                premiumExpiresAt: user.premiumExpiresAt,
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

