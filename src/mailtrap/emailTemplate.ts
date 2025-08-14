export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Verify Your Email - LingoVault</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f8fafc;">
  
  <!-- Main Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Email Content Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 48px 20px; text-align: center;">
              <img src="https://mailsend-email-assets.mailtrap.io/hss73685gvkxebz0ody5tfzvh0r1.png" alt="LingoVault Logo" style="width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 24px; display: block;" />
              <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Email Verification
              </h1>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 18px; font-weight: 400;">
                Welcome to LingoVault! Let's verify your email address
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              
              <!-- Greeting -->
              <h2 style="margin: 0 0 24px 0; font-size: 24px; color: #1a1a1a; font-weight: 600;">
                Hello there! 👋
              </h2>
              
              <!-- Main Message -->
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #4a5568; line-height: 1.7;">
                Thank you for joining LingoVault! To complete your registration and start your language learning journey, please verify your email address with the code below.
              </p>
              
              <!-- Verification Code -->
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
                <p style="margin: 0 0 16px 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 500;">
                  Your verification code
                </p>
                <div style="background-color: rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 20px; margin: 0 auto; display: inline-block;">
                  <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', monospace;">
                    {verificationCode}
                  </span>
                </div>
              </div>
              
              <!-- Instructions -->
                              <div style="background-color: #f7fafc; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 24px; margin: 32px 0;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #2d3748; font-weight: 600;">
                  📋 Next Steps
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">Enter this code on the verification page</li>
                  <li style="margin-bottom: 8px;">Code expires in <strong>24 hours</strong> for security</li>
                  <li>If you didn't create this account, please ignore this email</li>
                </ul>
              </div>
              
              <!-- Footer Message -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 32px; margin-top: 40px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #4a5568;">
                  Excited to have you on board! 🚀
                </p>
                <p style="margin: 0; font-size: 15px; color: #4a5568;">
                  Best regards,<br>
                  <strong style="color: #2d3748;">The LingoVault Team</strong>
                </p>
              </div>
              
            </td>
          </tr>
          
        </table>
        
        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px;">
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #a0aec0; font-size: 13px;">
                This is an automated message. Please do not reply to this email.
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                © 2025 LingoVault. Made with ❤️ for language learners.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Password Reset Successful - LingoVault</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f8fafc;">
  
  <!-- Main Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Email Content Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 48px 20px; text-align: center;">
              <img src="https://mailsend-email-assets.mailtrap.io/hss73685gvkxebz0ody5tfzvh0r1.png" alt="LingoVault Logo" style="width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 24px; display: block;" />
              <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Password Reset Complete
              </h1>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 18px; font-weight: 400;">
                Your account is now secure with a new password
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              
              <!-- Greeting -->
              <h2 style="margin: 0 0 24px 0; font-size: 24px; color: #1a1a1a; font-weight: 600;">
                Great news! 🎉
              </h2>
              
              <!-- Main Message -->
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #4a5568; line-height: 1.7;">
                Your LingoVault password has been successfully reset. You can now log in with your new password and continue your language learning journey.
              </p>
              
              <!-- Success Confirmation -->
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
                <div style="background-color: rgba(255, 255, 255, 0.15); width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <div style="font-size: 28px;">🔐</div>
                </div>
                <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                  Password Updated Successfully
                </h3>
                <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">
                  Your account is now protected with a new password
                </p>
              </div>
              
              <!-- Security Notice -->
                              <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 24px; margin: 32px 0;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #1e40af; font-weight: 600;">
                  ⚠️ Important Security Notice
                </h3>
                <p style="margin: 0 0 16px 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                  If you did not initiate this password reset, please contact our support team immediately.
                </p>
              </div>
              
              <!-- Security Tips -->
              <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 0 8px 8px 0; padding: 24px; margin: 32px 0;">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #0c4a6e; font-weight: 600;">
                  🛡️ Keep Your Account Secure
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 15px; line-height: 1.7;">
                  <li style="margin-bottom: 8px;">Use a strong, unique password with at least 12 characters</li>
                  <li style="margin-bottom: 8px;">Enable two-factor authentication for extra security</li>
                  <li style="margin-bottom: 8px;">Never share your password with anyone</li>
                  <li>Log out from shared or public devices</li>
                </ul>
              </div>
              
              <!-- Footer Message -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 32px; margin-top: 40px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #4a5568;">
                  Thank you for keeping your LingoVault account secure! 🔒
                </p>
                <p style="margin: 0; font-size: 15px; color: #4a5568;">
                  Best regards,<br>
                  <strong style="color: #2d3748;">The LingoVault Security Team</strong>
                </p>
              </div>
              
            </td>
          </tr>
          
        </table>
        
        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px;">
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #a0aec0; font-size: 13px;">
                This is an automated security message. Please do not reply to this email.
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                © 2025 LingoVault. Made with 💙 for language learners.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
`;


export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your Password - LingoVault</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f8fafc;">
  
  <!-- Main Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Email Content Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 48px 20px; text-align: center;">
              <img src="https://mailsend-email-assets.mailtrap.io/hss73685gvkxebz0ody5tfzvh0r1.png" alt="LingoVault Logo" style="width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 24px; display: block;" />
              <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Password Reset Request
              </h1>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 18px; font-weight: 400;">
                Let's help you regain access to your LingoVault account
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              
              <!-- Greeting -->
              <h2 style="margin: 0 0 24px 0; font-size: 24px; color: #1a1a1a; font-weight: 600;">
                Hello! 👋
              </h2>
              
              <!-- Main Message -->
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #4a5568; line-height: 1.7;">
                We received a request to reset the password for your LingoVault account. Don't worry - it happens to the best of us! Click the button below to create a new password and get back to learning.
              </p>
              
              <!-- Info Notice -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 24px; margin: 32px 0;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #1e40af; font-weight: 600;">
                  ℹ️ What you need to know
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 15px; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">This link is valid for <strong>1 hour</strong> for security</li>
                  <li style="margin-bottom: 8px;">You can request a new link if this one expires</li>
                  <li>If you didn't request this, you can safely ignore this email</li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 32px 0;">
                    <a href="{resetURL}" 
                       style="display: inline-block; 
                              background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); 
                              color: #ffffff; 
                              text-decoration: none; 
                              padding: 18px 36px; 
                              border-radius: 12px; 
                              font-weight: 600; 
                              font-size: 16px; 
                              text-align: center; 
                              box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);
                              transition: all 0.2s ease;">
                      🔐 Reset My Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative URL -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 32px 0; text-align: center;">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; font-weight: 500;">
                  Can't click the button? Copy and paste this link:
                </p>
                <p style="margin: 0; font-size: 13px; color: #4b5563; word-break: break-all; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                  {resetURL}
                </p>
              </div>
              
              <!-- Footer Message -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 32px; margin-top: 40px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #4a5568;">
                  Need help? Our support team is here for you! 💬
                </p>
                <p style="margin: 0; font-size: 15px; color: #4a5568;">
                  Best regards,<br>
                  <strong style="color: #2d3748;">The LingoVault Security Team</strong>
                </p>
              </div>
              
            </td>
          </tr>
          
        </table>
        
        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px;">
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #a0aec0; font-size: 13px;">
                This is an automated security message. Please do not reply to this email.
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                © 2025 LingoVault. Made with ❤️ for language learners.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
`;