import { sendEmail } from './email.config';
import { createVerificationEmailTemplate, createPasswordResetEmailTemplate } from './email.templates';

// Doğrulama emaili gönderme
export const sendVerificationEmail = async (email: string, verificationCode: string, userName: string): Promise<boolean> => {
    const subject = 'Email Doğrulama Kodu';
    const html = createVerificationEmailTemplate(userName, verificationCode);
    
    return await sendEmail(email, subject, html);
};

// Test emaili gönderme
export const sendTestEmail = async (email: string): Promise<boolean> => {
    const subject = 'Test Email - MyDowry Backend';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Test Email</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Test Email</h1>
        </div>
        <div class="content">
            <h2>Email Sistemi Çalışıyor! 🎉</h2>
            <p>Bu bir test emailidir. Email sistemi başarıyla çalışıyor.</p>
            <p>Gönderim zamanı: ${new Date().toLocaleString('tr-TR')}</p>
        </div>
    </body>
    </html>
    `;
    
    return await sendEmail(email, subject, html);
};

// Şifre sıfırlama emaili gönderme
export const sendPasswordResetEmail = async (email: string, resetToken: string, userName: string): Promise<boolean> => {
    const subject = 'Şifre Sıfırlama Talebi';
    const html = createPasswordResetEmailTemplate(userName, resetToken);
    
    return await sendEmail(email, subject, html);
};
