import { google } from 'googleapis';

/**
 * Google Play Billing API servisi
 * Google Play Store'dan gelen ödeme token'larını doğrular
 */
export class GooglePlayBillingService {
  private androidPublisher: any;

  constructor() {
    // Google Play Developer API için service account kullanıyoruz
    let privateKey = process.env.GOOGLE_PLAY_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('GOOGLE_PLAY_PRIVATE_KEY environment variable bulunamadı');
    }
    
    // Tırnak işaretlerini kaldır (başta ve sonda)
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
    
    // Escape edilmiş newline'ları gerçek newline'lara çevir
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // Tekrar trim yap (tırnak kaldırdıktan sonra)
    privateKey = privateKey.trim();
    
    // Key formatını kontrol et
    if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('BEGIN RSA PRIVATE KEY')) {
      throw new Error('Geçersiz private key formatı: BEGIN marker bulunamadı');
    }
    
    if (!privateKey.includes('END PRIVATE KEY') && !privateKey.includes('END RSA PRIVATE KEY')) {
      throw new Error('Geçersiz private key formatı: END marker bulunamadı');
    }
    
    // Key'in başında ve sonunda newline olmasını sağla (eğer yoksa)
    if (!privateKey.startsWith('-----')) {
      throw new Error('Private key formatı hatalı: BEGIN marker düzgün değil');
    }
    
    if (!privateKey.endsWith('-----')) {
      throw new Error('Private key formatı hatalı: END marker düzgün değil');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
        project_id: process.env.GOOGLE_PLAY_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    this.androidPublisher = google.androidpublisher({
      version: 'v3',
      auth,
    });
  }

  /**
   * Google Play Store purchase token'ını doğrular
   * @param packageName - Uygulama paket adı (com.example.app)
   * @param productId - Ürün ID (subscription veya in-app product ID)
   * @param purchaseToken - Google Play'den gelen purchase token
   * @param isSubscription - Subscription mı yoksa one-time purchase mı?
   */
  async verifyPurchase(
    packageName: string,
    productId: string,
    purchaseToken: string,
    isSubscription: boolean = false
  ): Promise<{ valid: boolean; purchase?: any; error?: string }> {
    try {
      if (isSubscription) {
        // Subscription doğrulama
        const response = await this.androidPublisher.purchases.subscriptions.get({
          packageName,
          subscriptionId: productId,
          token: purchaseToken,
        });

        const purchase = response.data;

        // Subscription durumunu kontrol et
        if (purchase.paymentState === 1) { // 1 = Payment received
          return {
            valid: true,
            purchase: {
              orderId: purchase.orderId,
              purchaseToken: purchaseToken,
              purchaseTimeMillis: purchase.purchaseTimeMillis,
              expiryTimeMillis: purchase.expiryTimeMillis,
              autoRenewing: purchase.autoRenewing,
              paymentState: purchase.paymentState,
            },
          };
        } else {
          return {
            valid: false,
            error: `Subscription payment not completed. State: ${purchase.paymentState}`,
          };
        }
      } else {
        // One-time purchase doğrulama
        const response = await this.androidPublisher.purchases.products.get({
          packageName,
          productId,
          token: purchaseToken,
        });

        const purchase = response.data;

        // Purchase durumunu kontrol et
        if (purchase.purchaseState === 0) { // 0 = Purchased
          return {
            valid: true,
            purchase: {
              orderId: purchase.orderId,
              purchaseToken: purchaseToken,
              purchaseTimeMillis: purchase.purchaseTimeMillis,
              purchaseState: purchase.purchaseState,
            },
          };
        } else {
          return {
            valid: false,
            error: `Purchase not completed. State: ${purchase.purchaseState}`,
          };
        }
      }
    } catch (error: any) {
      console.error('Google Play Billing verification error:', error);
      
      // 410 hatası = Token zaten kullanılmış
      if (error.code === 410) {
        return {
          valid: false,
          error: 'Purchase token already consumed',
        };
      }

      return {
        valid: false,
        error: error.message || 'Failed to verify purchase',
      };
    }
  }

  /**
   * Subscription'ı iptal et veya yenile
   */
  async cancelSubscription(
    packageName: string,
    subscriptionId: string,
    purchaseToken: string
  ): Promise<boolean> {
    try {
      await this.androidPublisher.purchases.subscriptions.cancel({
        packageName,
        subscriptionId,
        token: purchaseToken,
      });
      return true;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return false;
    }
  }
}

