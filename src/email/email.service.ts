import { sendEmail } from './email.config';

// Doğrulama emaili gönderme (geçici olarak devre dışı)
export const sendVerificationEmail = async (email: string, verificationCode: string, userName: string): Promise<boolean> => {
    console.log('Verification email service is temporarily disabled');
    console.log('Would send verification email to:', email);
    console.log('User:', userName);
    console.log('Code:', verificationCode);
    return false;
};

// Test emaili gönderme (geçici olarak devre dışı)
export const sendTestEmail = async (email: string): Promise<boolean> => {
    console.log('Test email service is temporarily disabled');
    console.log('Would send test email to:', email);
    return false;
};

// Şifre sıfırlama emaili gönderme (geçici olarak devre dışı)
export const sendPasswordResetEmail = async (email: string, resetToken: string, userName: string): Promise<boolean> => {
    console.log('Password reset email service is temporarily disabled');
    console.log('Would send password reset email to:', email);
    console.log('User:', userName);
    console.log('Token:', resetToken);
    return false;
};