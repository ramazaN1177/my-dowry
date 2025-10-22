import nodemailer from 'nodemailer';

// Email konfigürasyonu - Load environment variables dynamically
export const getEmailConfig = () => ({
    HOST: process.env.EMAIL_HOST ,
    PORT: parseInt(process.env.EMAIL_PORT || ''),
    SECURE: process.env.EMAIL_SECURE === 'true',
    USER: process.env.EMAIL_USER || '',
    PASS: process.env.EMAIL_PASS || '',
    FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER || ''
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
        host: emailConfig.HOST || 'smtp.gmail.com',
        port: emailConfig.PORT || 587,
        secure: emailConfig.SECURE || false, // 587 port için false
        auth: {
            user: emailConfig.USER,
            pass: emailConfig.PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    } as any);
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
        
        // Verify transporter configuration with timeout
        console.log('Verifying transporter...');
        try {
            await Promise.race([
                transporter.verify(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Verification timeout')), 30000)
                )
            ]);
            console.log('Email transporter verified successfully');
        } catch (verifyError: any) {
            console.warn('Transporter verification failed, but continuing anyway:', verifyError.message);
            // Verification başarısız olsa bile email göndermeyi deneyebiliriz
        }
        
        const mailOptions = {
            from: emailConfig.FROM,
            to: to,
            subject: subject,
            html: html
        };

        console.log('Sending mail...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error: any) {
        console.error('Email send error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === 'EAUTH') {
            console.error('Authentication failed. Please check your email credentials and app password.');
        } else if (error.code === 'ECONNECTION') {
            console.error('Connection failed. Check network settings.');
        }
        return false;
    }
};

// Alternatif email gönderme fonksiyonu (verify olmadan)
export const sendEmailDirect = async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
        const emailConfig = getEmailConfig();
        
        console.log('Sending email directly (no verification)...');
        
        if (!emailConfig.USER || !emailConfig.PASS) {
            console.error('Email configuration error: Missing USER or PASS');
            return false;
        }

        const transporter = createTransporter(emailConfig);
        
        const mailOptions = {
            from: emailConfig.FROM,
            to: to,
            subject: subject,
            html: html
        };

        console.log('Sending mail directly...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error: any) {
        console.error('Direct email send error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        return false;
    }
};

// Alternatif Gmail konfigürasyonu (farklı port)
export const createTransporterAlternative = (emailConfig: any) => {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465, // SSL port
        secure: true, // SSL kullan
        auth: {
            user: emailConfig.USER,
            pass: emailConfig.PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    } as any);
};

// Alternatif email gönderme (SSL port ile)
export const sendEmailSSL = async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
        const emailConfig = getEmailConfig();
        
        console.log('Sending email with SSL (port 465)...');
        
        if (!emailConfig.USER || !emailConfig.PASS) {
            console.error('Email configuration error: Missing USER or PASS');
            return false;
        }

        const transporter = createTransporterAlternative(emailConfig);
        
        const mailOptions = {
            from: emailConfig.FROM,
            to: to,
            subject: subject,
            html: html
        };

        console.log('Sending mail with SSL...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error: any) {
        console.error('SSL email send error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        return false;
    }
};
