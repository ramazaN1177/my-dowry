import { AppDataSource } from '../db/connectDB';
import { Purchase } from '../entities/purchase.entity';
import { User } from '../entities/user.entity';
import { BillingServiceClient } from './billing-service.client';
import { PackageType } from '../controller/payment.controller';
import { IsNull, Equal, Or } from 'typeorm';

/**
 * Purchase geri alma fonksiyonu
 * payment.controller.ts'den import edilebilir ama burada kopyalıyoruz
 * circular dependency'yi önlemek için
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
 * Purchase Check Service
 * Periyodik olarak purchase'ları kontrol eder ve geri ödeme durumunu tespit eder
 */
export class PurchaseCheckService {
    private billingServiceClient: BillingServiceClient;
    private checkInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    constructor() {
        this.billingServiceClient = new BillingServiceClient();
    }

    /**
     * Tek bir purchase'ı kontrol et ve gerekirse geri al
     */
    private async checkPurchase(purchase: Purchase): Promise<void> {
        try {
            // Purchase state zaten Canceled ise, tekrar kontrol etmeye gerek yok
            if (purchase.purchaseState === 1) {
                return;
            }

            // Billing service üzerinden purchase'ı doğrula
            const isSubscription = purchase.isSubscription || false;
            const verification = await this.billingServiceClient.verifyPurchase(
                purchase.packageName,
                purchase.productId,
                purchase.purchaseToken,
                isSubscription
            );

            if (!verification.valid) {
                console.log(`[PurchaseCheck] Purchase ${purchase.id} verification failed`);
                return;
            }

            const currentPurchaseState = verification.purchase?.purchaseState;

            // Purchase state değişmiş mi kontrol et
            if (currentPurchaseState === 1 && purchase.purchaseState !== 1) {
                // Purchase iptal edilmiş/geri ödeme yapılmış
                console.log(`[PurchaseCheck] Purchase ${purchase.id} has been canceled/refunded`);

                // Paketi geri al
                await revokePackage(purchase.userId, purchase.packageType as PackageType);

                // Purchase kaydını güncelle
                const purchaseRepository = AppDataSource.getRepository(Purchase);
                purchase.purchaseState = 1; // Canceled
                await purchaseRepository.save(purchase);

                console.log(`[PurchaseCheck] Package revoked for user ${purchase.userId}, purchase ${purchase.id}`);
            } else if (currentPurchaseState !== undefined && currentPurchaseState !== purchase.purchaseState) {
                // Purchase state güncellenmiş (Pending -> Purchased gibi)
                const purchaseRepository = AppDataSource.getRepository(Purchase);
                purchase.purchaseState = currentPurchaseState;
                await purchaseRepository.save(purchase);
                console.log(`[PurchaseCheck] Purchase ${purchase.id} state updated to ${currentPurchaseState}`);
            }
        } catch (error) {
            console.error(`[PurchaseCheck] Error checking purchase ${purchase.id}:`, error);
        }
    }

    /**
     * Tüm aktif purchase'ları kontrol et
     */
    private async checkAllPurchases(): Promise<void> {
        try {
            const purchaseRepository = AppDataSource.getRepository(Purchase);
            
            // Purchase state 0 (Purchased) veya null olan purchase'ları al
            // (Canceled olanlar zaten işlendiği için tekrar kontrol etmeye gerek yok)
            const activePurchases = await purchaseRepository.find({
                where: [
                    { purchaseState: Equal(0) },
                    { purchaseState: IsNull() }
                ],
                take: 100 // Her seferinde maksimum 100 purchase kontrol et (rate limit'i önlemek için)
            });

            console.log(`[PurchaseCheck] Checking ${activePurchases.length} active purchases...`);

            // Her purchase'ı sırayla kontrol et
            for (const purchase of activePurchases) {
                await this.checkPurchase(purchase);
                
                // Rate limit'i önlemek için kısa bir bekleme
                await new Promise(resolve => setTimeout(resolve, 100)); // 100ms bekleme
            }

            console.log(`[PurchaseCheck] Finished checking ${activePurchases.length} purchases`);
        } catch (error) {
            console.error('[PurchaseCheck] Error checking purchases:', error);
        }
    }

    /**
     * Periyodik kontrolü başlat
     * @param intervalMinutes Kontrol aralığı (dakika cinsinden, varsayılan 60)
     */
    public start(intervalMinutes: number = 60): void {
        if (this.isRunning) {
            console.log('[PurchaseCheck] Service is already running');
            return;
        }

        console.log(`[PurchaseCheck] Starting periodic check service (interval: ${intervalMinutes} minutes)`);
        this.isRunning = true;

        // İlk kontrolü hemen yap (asenkron, hata yakalanmış)
        this.checkAllPurchases().catch((error) => {
            console.error('[PurchaseCheck] Error in initial check:', error);
        });

        // Periyodik kontrolü başlat
        const intervalMs = intervalMinutes * 60 * 1000; // Dakika -> milisaniye
        this.checkInterval = setInterval(() => {
            this.checkAllPurchases();
        }, intervalMs);
    }

    /**
     * Periyodik kontrolü durdur
     */
    public stop(): void {
        if (!this.isRunning) {
            return;
        }

        console.log('[PurchaseCheck] Stopping periodic check service');
        this.isRunning = false;

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Manuel kontrol tetikleme
     */
    public async triggerCheck(): Promise<void> {
        console.log('[PurchaseCheck] Manual check triggered');
        await this.checkAllPurchases();
    }
}

// Singleton instance
let purchaseCheckServiceInstance: PurchaseCheckService | null = null;

/**
 * Purchase Check Service instance'ını al
 */
export const getPurchaseCheckService = (): PurchaseCheckService => {
    if (!purchaseCheckServiceInstance) {
        purchaseCheckServiceInstance = new PurchaseCheckService();
    }
    return purchaseCheckServiceInstance;
};
