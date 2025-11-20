import nodemailer from 'nodemailer';

// Nodemailer transporter oluştur
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

// Email gönderme fonksiyonu
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// Doğrulama emaili gönderme fonksiyonu (geriye dönük uyumluluk için)
export const sendEmailWithEmailJS = async (to: string, subject: string, html: string, userName?: string, verificationCode?: string): Promise<boolean> => {
    return sendEmail(to, subject, html);
};