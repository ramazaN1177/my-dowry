import axios, { AxiosInstance } from 'axios';
import * as jwt from 'jsonwebtoken';

/**
 * Billing Service Client
 * Communicates with the internal billing microservice using JWT tokens
 */
export class BillingServiceClient {
  private client: AxiosInstance;
  private baseURL: string;
  private jwtSecret: string;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor() {
    // Get URL from environment variable (required)
    this.baseURL = process.env.BILLING_SERVICE_URL || '';
    this.jwtSecret = process.env.BILLING_SERVICE_JWT_SECRET || process.env.JWT_SECRET || '';
    
    // Validate required environment variable
    if (!this.baseURL) {
      const errorMsg = 'BILLING_SERVICE_URL environment variable is required';
      console.error('[BillingServiceClient]', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[BillingServiceClient] Initialized with URL:', this.baseURL);
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000, // 10 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate or get cached JWT token
   */
  private getToken(): string {
    // Check if cached token is still valid (5 minutes before expiry)
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
      return this.tokenCache.token;
    }

    if (!this.jwtSecret) {
      throw new Error('BILLING_SERVICE_JWT_SECRET or JWT_SECRET is required');
    }

    // Generate new token (valid for 1 hour)
    const token = jwt.sign(
      {
        service: 'mydowry-backend',
        type: 'billing-service-access',
        iat: Math.floor(Date.now() / 1000),
      },
      this.jwtSecret,
      { expiresIn: '1h' }
    );

    // Cache token
    this.tokenCache = {
      token,
      expiresAt: Date.now() + 55 * 60 * 1000, // Cache for 55 minutes
    };

    return token;
  }

  /**
   * Verify a Google Play purchase or subscription
   * @param packageName - App package name
   * @param productId - Product or subscription ID
   * @param purchaseToken - Purchase token from Google Play
   * @param isSubscription - Whether it's a subscription or one-time purchase
   */
  async verifyPurchase(
    packageName: string,
    productId: string,
    purchaseToken: string,
    isSubscription: boolean = false
  ): Promise<{ valid: boolean; purchase?: any; error?: string }> {
    try {
      // Get JWT token
      const token = this.getToken();

      const response = await this.client.post('/verify', {
        packageName,
        productId,
        purchaseToken,
        isSubscription,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.valid) {
        return {
          valid: true,
          purchase: response.data.purchase,
        };
      } else {
        return {
          valid: false,
          error: response.data.error || 'Verification failed',
        };
      }
    } catch (error: any) {
      console.error('Billing service error:', error);
      
      // Handle network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return {
          valid: false,
          error: 'Billing service unavailable',
        };
      }

      // Handle HTTP errors
      if (error.response) {
        return {
          valid: false,
          error: error.response.data?.error || error.response.data?.message || 'Verification failed',
        };
      }

      return {
        valid: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Health check for billing service
   * Note: /health endpoint is public and doesn't require JWT token
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use the same URL resolution as direct test
      const testUrl = process.env.BILLING_SERVICE_URL || this.baseURL || 'http://localhost:3001';
      const url = `${testUrl}/health`;
      
      console.log('[BillingServiceClient] Health check URL:', url);
      console.log('[BillingServiceClient] this.baseURL:', this.baseURL);
      console.log('[BillingServiceClient] process.env.BILLING_SERVICE_URL:', process.env.BILLING_SERVICE_URL);
      
      // Use direct axios call for health check (no auth needed)
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('[BillingServiceClient] Health check response:', {
        status: response.status,
        data: response.data
      });
      
      return response.status === 200;
    } catch (error: any) {
      console.error('[BillingServiceClient] Health check failed:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: this.baseURL + '/health',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      return false;
    }
  }
}

