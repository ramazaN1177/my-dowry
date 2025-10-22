// Doğrulama emaili template'i
export const createVerificationEmailTemplate = (userName: string, verificationCode: string): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Email Doğrulama</title>
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
                box-shadow: 0 8px 32px rgba(255, 193, 7, 0.15);
                overflow: hidden;
                border: 1px solid #fff3cd;
            }
            .header {
                background: linear-gradient(135deg, #ffc107 0%, #ffb300 50%, #ff8f00 100%);
                color: #212529;
                padding: 40px 30px;
                text-align: center;
                position: relative;
            }
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                position: relative;
                z-index: 1;
            }
            .content {
                padding: 40px 30px;
                background: #ffffff;
            }
            .greeting {
                font-size: 20px;
                color: #212529;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .description {
                color: #6c757d;
                margin-bottom: 30px;
                font-size: 16px;
            }
            .verification-code {
                background: linear-gradient(135deg, #fff3cd 0%, #fffbf0 100%);
                border: 3px solid #ffc107;
                border-radius: 12px;
                padding: 25px;
                text-align: center;
                margin: 30px 0;
                position: relative;
                box-shadow: 0 4px 20px rgba(255, 193, 7, 0.2);
            }
            .verification-code::before {
                content: '🔐';
                position: absolute;
                top: -15px;
                left: 50%;
                transform: translateX(-50%);
                background: #ffc107;
                padding: 8px 12px;
                border-radius: 50%;
                font-size: 16px;
            }
            .code-text {
                font-size: 32px;
                font-weight: 800;
                color: #212529;
                letter-spacing: 8px;
                margin: 10px 0;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .code-label {
                font-size: 12px;
                color: #6c757d;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 10px;
            }
            .info-box {
                background: #fff8e1;
                border-left: 4px solid #ffb300;
                padding: 15px 20px;
                margin: 25px 0;
                border-radius: 0 8px 8px 0;
            }
            .info-box p {
                margin: 8px 0;
                color: #5d4037;
                font-size: 14px;
            }
            .footer {
                background: #f8f9fa;
                text-align: center;
                padding: 20px 30px;
                color: #6c757d;
                font-size: 12px;
                border-top: 1px solid #e9ecef;
            }
            .footer p {
                margin: 5px 0;
            }
            .brand-name {
                color: #ffc107;
                font-weight: 600;
            }
            @media (max-width: 600px) {
                body {
                    padding: 10px;
                }
                .header, .content, .footer {
                    padding: 20px 15px;
                }
                .code-text {
                    font-size: 24px;
                    letter-spacing: 4px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Email Doğrulama</h1>
            </div>
            <div class="content">
                <div class="greeting">Merhaba ${userName}! 👋</div>
                <div class="description">
                    <span class="brand-name">MyDowry</span> hesabınızı doğrulamak için aşağıdaki güvenlik kodunu kullanın:
                </div>
                
                <div class="verification-code">
                    <div class="code-label">Doğrulama Kodu</div>
                    <div class="code-text">${verificationCode}</div>
                </div>
                
                <div class="info-box">
                    <p>⏰ Bu kod 24 saat boyunca geçerlidir.</p>
                    <p>🔒 Güvenliğiniz için bu kodu kimseyle paylaşmayın.</p>
                    <p>❌ Bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
                </div>
            </div>
            <div class="footer">
                <p>Bu email <span class="brand-name">MyDowry</span> tarafından otomatik olarak gönderilmiştir.</p>
                <p>Lütfen bu emaili yanıtlamayın.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Şifre sıfırlama emaili template'i
export const createPasswordResetEmailTemplate = (userName: string, resetToken: string): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Şifre Sıfırlama</title>
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
                box-shadow: 0 8px 32px rgba(220, 53, 69, 0.15);
                overflow: hidden;
                border: 1px solid #f5c6cb;
            }
            .header {
                background: linear-gradient(135deg, #dc3545 0%, #c82333 50%, #bd2130 100%);
                color: #ffffff;
                padding: 40px 30px;
                text-align: center;
                position: relative;
            }
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                position: relative;
                z-index: 1;
            }
            .content {
                padding: 40px 30px;
                background: #ffffff;
            }
            .greeting {
                font-size: 20px;
                color: #212529;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .description {
                color: #6c757d;
                margin-bottom: 30px;
                font-size: 16px;
            }
            .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                color: #ffffff;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
                transition: all 0.3s ease;
            }
            .reset-button:hover {
                background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
            }
            .reset-token {
                background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
                border: 2px solid #dc3545;
                border-radius: 12px;
                padding: 25px;
                text-align: center;
                margin: 30px 0;
                position: relative;
                box-shadow: 0 4px 20px rgba(220, 53, 69, 0.2);
            }
            .reset-token::before {
                content: '🔑';
                position: absolute;
                top: -15px;
                left: 50%;
                transform: translateX(-50%);
                background: #dc3545;
                padding: 8px 12px;
                border-radius: 50%;
                font-size: 16px;
            }
            .token-text {
                font-size: 18px;
                font-weight: 700;
                color: #721c24;
                letter-spacing: 2px;
                margin: 10px 0;
                word-break: break-all;
                font-family: 'Courier New', monospace;
            }
            .token-label {
                font-size: 12px;
                color: #6c757d;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 10px;
            }
            .info-box {
                background: #f8d7da;
                border-left: 4px solid #dc3545;
                padding: 15px 20px;
                margin: 25px 0;
                border-radius: 0 8px 8px 0;
            }
            .info-box p {
                margin: 8px 0;
                color: #721c24;
                font-size: 14px;
            }
            .footer {
                background: #f8f9fa;
                text-align: center;
                padding: 20px 30px;
                color: #6c757d;
                font-size: 12px;
                border-top: 1px solid #e9ecef;
            }
            .footer p {
                margin: 5px 0;
            }
            .brand-name {
                color: #dc3545;
                font-weight: 600;
            }
            .warning-box {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
            }
            .warning-box p {
                margin: 5px 0;
                color: #856404;
                font-size: 14px;
            }
            @media (max-width: 600px) {
                body {
                    padding: 10px;
                }
                .header, .content, .footer {
                    padding: 20px 15px;
                }
                .token-text {
                    font-size: 14px;
                    letter-spacing: 1px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Şifre Sıfırlama</h1>
            </div>
            <div class="content">
                <div class="greeting">Merhaba ${userName}! 👋</div>
                <div class="description">
                    <span class="brand-name">MyDowry</span> hesabınız için şifre sıfırlama talebinde bulundunuz. 
                    Aşağıdaki butona tıklayarak veya token'ı kullanarak şifrenizi sıfırlayabilirsiniz.
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}" class="reset-button">
                        🔐 Şifremi Sıfırla
                    </a>
                </div>
                
                <div class="reset-token">
                    <div class="token-label">Sıfırlama Token'ı</div>
                    <div class="token-text">${resetToken}</div>
                </div>
                
                <div class="warning-box">
                    <p>⚠️ Bu token sadece 1 saat boyunca geçerlidir.</p>
                    <p>🔒 Güvenliğiniz için bu token'ı kimseyle paylaşmayın.</p>
                    <p>❌ Bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
                </div>
                
                <div class="info-box">
                    <p>📱 Token'ı kopyalayıp uygulamada "Şifre Sıfırlama" sayfasında kullanabilirsiniz.</p>
                    <p>🌐 Alternatif olarak yukarıdaki butona tıklayarak web sayfasından sıfırlayabilirsiniz.</p>
                </div>
            </div>
            <div class="footer">
                <p>Bu email <span class="brand-name">MyDowry</span> tarafından otomatik olarak gönderilmiştir.</p>
                <p>Lütfen bu emaili yanıtlamayın.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
