import nodemailer from 'nodemailer';

// Nodemailer transporter oluştur
const createTransporter = () => {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const secure = process.env.EMAIL_SECURE === 'true'; // true for 465, false for other ports
    
    // Gmail için özel yapılandırma
    const isGmail = host.includes('gmail.com');
    
    const transporterConfig: any = {
        host: host,
        port: port,
        secure: secure,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    };

    // Gmail için ek güvenlik ayarları
    if (isGmail) {
        transporterConfig.service = 'gmail';
        // TLS ayarları
        transporterConfig.tls = {
            rejectUnauthorized: false
        };
        // Gmail için önerilen ayarlar
        if (!secure && port === 587) {
            transporterConfig.requireTLS = true;
        }
    }

    return nodemailer.createTransport(transporterConfig);
};

// Email gönderme fonksiyonu
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
        // Email yapılandırmasını kontrol et
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Email configuration error: EMAIL_USER or EMAIL_PASS is not set');
            return false;
        }

        const transporter = createTransporter();
        
        // Bağlantıyı test et
        await transporter.verify();
        console.log('Email server connection verified');
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error: any) {
        console.error('Error sending email:', error);
        
        // Daha açıklayıcı hata mesajları
        if (error.code === 'EAUTH') {
            console.error('\n❌ Gmail Kimlik Doğrulama Hatası!');
            console.error('Çözüm adımları:');
            console.error('1. Gmail hesabınızda 2 Faktörlü Doğrulama (2FA) etkin olmalı');
            console.error('2. Gmail hesabınızdan "App Password" oluşturun:');
            console.error('   https://myaccount.google.com/apppasswords');
            console.error('3. .env dosyasında EMAIL_PASS değerini App Password ile değiştirin');
            console.error('4. Normal Gmail şifreniz çalışmaz, mutlaka App Password kullanın!\n');
        } else if (error.code === 'ECONNECTION') {
            console.error('Email sunucusuna bağlanılamıyor. EMAIL_HOST ve EMAIL_PORT ayarlarını kontrol edin.');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('Email sunucusu bağlantı zaman aşımı. Ağ bağlantınızı kontrol edin.');
        }
        
        return false;
    }
};

// Doğrulama emaili gönderme fonksiyonu (geriye dönük uyumluluk için)
export const sendEmailWithEmailJS = async (to: string, subject: string, html: string, userName?: string, verificationCode?: string): Promise<boolean> => {
    return sendEmail(to, subject, html);
};