import { sendEmail } from './email.config';
import { createVerificationEmailTemplate, createPasswordResetEmailTemplate } from './email.templates';

// Doğrulama emaili gönderme
export const sendVerificationEmail = async (email: string, verificationCode: string, userName: string): Promise<boolean> => {
    try {
        const subject = 'MyDowry - Email Doğrulama';
        const html = createVerificationEmailTemplate(userName, verificationCode);
        const result = await sendEmail(email, subject, html);
        
        if (result) {
            console.log(`Verification email sent successfully to: ${email}`);
        } else {
            console.error(`Failed to send verification email to: ${email}`);
        }
        
        return result;
    } catch (error) {
        console.error('Error in sendVerificationEmail:', error);
        return false;
    }
};

// Test emaili gönderme
export const sendTestEmail = async (email: string): Promise<boolean> => {
    try {
        const subject = 'MyDowry - Test Emaili';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Test Emaili</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #fefefe;
                    }
                    .container {
                        background: #ffffff;
                        border-radius: 16px;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                        padding: 40px;
                        text-align: center;
                    }
                    h1 {
                        color: #ffc107;
                        margin-bottom: 20px;
                    }
                    p {
                        color: #6c757d;
                        font-size: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>✅ Test Emaili Başarılı!</h1>
                    <p>MyDowry email servisi aktif ve çalışıyor.</p>
                    <p>Bu email ${new Date().toLocaleString('tr-TR')} tarihinde gönderilmiştir.</p>
                </div>
            </body>
            </html>
        `;
        const result = await sendEmail(email, subject, html);
        
        if (result) {
            console.log(`Test email sent successfully to: ${email}`);
        } else {
            console.error(`Failed to send test email to: ${email}`);
        }
        
        return result;
    } catch (error) {
        console.error('Error in sendTestEmail:', error);
        return false;
    }
};

// Şifre sıfırlama emaili gönderme
export const sendPasswordResetEmail = async (email: string, resetToken: string, userName: string): Promise<boolean> => {
    try {
        const subject = 'MyDowry - Şifre Sıfırlama';
        const html = createPasswordResetEmailTemplate(userName, resetToken);
        const result = await sendEmail(email, subject, html);
        
        if (result) {
            console.log(`Password reset email sent successfully to: ${email}`);
        } else {
            console.error(`Failed to send password reset email to: ${email}`);
        }
        
        return result;
    } catch (error) {
        console.error('Error in sendPasswordResetEmail:', error);
        return false;
    }
};