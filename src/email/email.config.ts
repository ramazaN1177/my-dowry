import nodemailer from 'nodemailer';

// Email konfigürasyonu - Load environment variables dynamically
const getEmailConfig = () => ({
    HOST: process.env.EMAIL_HOST ,
    PORT: parseInt(process.env.EMAIL_PORT || ''),
    SECURE: process.env.EMAIL_SECURE === 'true',
    USER: process.env.EMAIL_USER || '',
    PASS: process.env.EMAIL_PASS || '',
    FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',

    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,

    pool: true,
    maxConnections: 1,
    maxMessages: 1,

    rateDelta: 20000,
    rateLimit: 1,

});

export const EMAIL_CONFIG = getEmailConfig();

// Debug: Log email configuration (without password)
console.log('Email Config:', {
    HOST: EMAIL_CONFIG.HOST,
    PORT: EMAIL_CONFIG.PORT,
    SECURE: EMAIL_CONFIG.SECURE,
    USER: EMAIL_CONFIG.USER,
    FROM: EMAIL_CONFIG.FROM,
    PASS_SET: !!EMAIL_CONFIG.PASS
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
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Email gönderme fonksiyonu
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
        // Get fresh email configuration
        const emailConfig = getEmailConfig();
        
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
        console.error('Email send error:', error);
        if (error.code === 'EAUTH') {
            console.error('Authentication failed. Please check your email credentials and app password.');
        }
        return false;
    }
};
