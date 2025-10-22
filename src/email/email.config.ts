import nodemailer from 'nodemailer';

// Email konfigürasyonu - Load environment variables dynamically
const getEmailConfig = () => ({
    // Gmail SMTP ayarları
    HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.EMAIL_PORT || '587'),
    SECURE: process.env.EMAIL_SECURE === 'true',
    USER: process.env.EMAIL_USER || '',
    PASS: process.env.EMAIL_PASS || '',
    FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',

    // Render için optimize edilmiş timeout değerleri
    connectionTimeout: 30000, // 30 saniye
    greetingTimeout: 15000,   // 15 saniye
    socketTimeout: 30000,     // 30 saniye

    // Connection pool ayarları
    pool: false, // Pool'u kapat, tek bağlantı kullan
    maxConnections: 1,
    maxMessages: 1,

    // Rate limiting
    rateDelta: 20000,
    rateLimit: 1,

    // Retry ayarları
    retryDelay: 5000,
    maxRetries: 3,
});

export const EMAIL_CONFIG = getEmailConfig();

// Environment variables kontrolü
const validateEmailConfig = (config: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!config.USER) errors.push('EMAIL_USER is required');
    if (!config.PASS) errors.push('EMAIL_PASS is required');
    if (!config.FROM) errors.push('EMAIL_FROM is required');
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Email konfigürasyonunu validate et
const validation = validateEmailConfig(EMAIL_CONFIG);
if (!validation.isValid) {
    console.error('Email configuration errors:', validation.errors);
} else {
    console.log('Email configuration is valid');
}

// Debug: Log email configuration (without password)
console.log('Email Config:', {
    HOST: EMAIL_CONFIG.HOST,
    PORT: EMAIL_CONFIG.PORT,
    SECURE: EMAIL_CONFIG.SECURE,
    USER: EMAIL_CONFIG.USER,
    FROM: EMAIL_CONFIG.FROM,
    PASS_SET: !!EMAIL_CONFIG.PASS,
    connectionTimeout: EMAIL_CONFIG.connectionTimeout,
    greetingTimeout: EMAIL_CONFIG.greetingTimeout,
    socketTimeout: EMAIL_CONFIG.socketTimeout,
    pool: EMAIL_CONFIG.pool,
    maxConnections: EMAIL_CONFIG.maxConnections,
    maxMessages: EMAIL_CONFIG.maxMessages,
    rateDelta: EMAIL_CONFIG.rateDelta,
    rateLimit: EMAIL_CONFIG.rateLimit,
});

// Nodemailer transporter oluştur
export const createTransporter = (emailConfig: any) => {
    return nodemailer.createTransport({
        service: 'gmail', // Gmail servisi kullan
        host: emailConfig.HOST,
        port: emailConfig.PORT,
        secure: emailConfig.SECURE,
        auth: {
            user: emailConfig.USER,
            pass: emailConfig.PASS,
        },
        // TLS ayarları - varsayılan güvenli ayarlar kullanılır
        // Render için optimize edilmiş ayarlar
        connectionTimeout: emailConfig.connectionTimeout,
        greetingTimeout: emailConfig.greetingTimeout,
        socketTimeout: emailConfig.socketTimeout,
        pool: emailConfig.pool,
        maxConnections: emailConfig.maxConnections,
        maxMessages: emailConfig.maxMessages,
        rateDelta: emailConfig.rateDelta,
        rateLimit: emailConfig.rateLimit,
    });
};

// Gmail SMTP ile email gönderme
const sendEmailWithGmail = async (to: string, subject: string, html: string, emailConfig: any): Promise<boolean> => {
    const maxRetries = emailConfig.maxRetries || 3;
    const retryDelay = emailConfig.retryDelay || 5000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Gmail email gönderme denemesi ${attempt}/${maxRetries}`);
            
            // Debug: Log the configuration being used
            console.log('Sending email with config:', {
                HOST: emailConfig.HOST,
                PORT: emailConfig.PORT,
                SECURE: emailConfig.SECURE,
                USER: emailConfig.USER,
                FROM: emailConfig.FROM,
                PASS_SET: !!emailConfig.PASS
            });
            
            // Validate email configuration
            if (!emailConfig.USER || !emailConfig.PASS) {
                console.error('Email configuration error: Missing USER or PASS');
                console.error('USER:', emailConfig.USER);
                console.error('PASS_SET:', !!emailConfig.PASS);
                return false;
            }

            const transporter = createTransporter(emailConfig);
            
            // Verify transporter configuration
            await transporter.verify();
            console.log('Email transporter verified successfully');
            
            const mailOptions = {
                from: emailConfig.FROM,
                to: to,
                subject: subject,
                html: html
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return true;
            
        } catch (error: any) {
            console.error(`Gmail email send error (attempt ${attempt}/${maxRetries}):`, error);
            
            if (error.code === 'EAUTH') {
                console.error('Authentication failed. Please check your email credentials and app password.');
                return false; // Don't retry auth errors
            }
            
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
                console.log(`Connection timeout/reset, retrying in ${retryDelay}ms...`);
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue;
                }
            }
            
            if (attempt === maxRetries) {
                console.error('All Gmail email send attempts failed');
                return false;
            }
        }
    }
    
    return false;
};

// Ana email gönderme fonksiyonu
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    const emailConfig = getEmailConfig();
    
    // Email konfigürasyonunu validate et
    const validation = validateEmailConfig(emailConfig);
    if (!validation.isValid) {
        console.error('Email configuration is invalid:', validation.errors);
        return false;
    }
    
    console.log('Gmail SMTP ile email gönderiliyor...');
    return await sendEmailWithGmail(to, subject, html, emailConfig);
};
