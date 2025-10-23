// Email servisi geçici olarak devre dışı
// Daha sonra email servisi eklenecek

// Geçici email gönderme fonksiyonu (her zaman false döner)
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    console.log('Email service is temporarily disabled');
    console.log('Would send email to:', to);
    console.log('Subject:', subject);
    return false;
};

// Geçici doğrulama emaili fonksiyonu
export const sendEmailWithEmailJS = async (to: string, subject: string, html: string, userName?: string, verificationCode?: string): Promise<boolean> => {
    console.log('Email service is temporarily disabled');
    console.log('Would send verification email to:', to);
    console.log('User:', userName);
    console.log('Code:', verificationCode);
    return false;
};