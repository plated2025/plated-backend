const nodemailer = require('nodemailer');

// Create transporter (optional for development)
let transporter = null;

try {
  transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Verify transporter configuration
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter.verify((error, success) => {
      if (error) {
        console.log('⚠️  Email configuration error:', error.message);
        console.log('📧 Email service disabled - verification emails won\'t be sent');
      } else {
        console.log('✅ Email service is ready');
      }
    });
  } else {
    console.log('⚠️  Email credentials not configured');
    console.log('📧 Email service disabled - verification emails won\'t be sent');
    console.log('💡 Tip: Add EMAIL_USER and EMAIL_PASSWORD to .env file to enable emails');
  }
} catch (error) {
  console.log('⚠️  Email service initialization failed:', error.message);
  console.log('📧 Email service disabled - app will continue without email functionality');
}

/**
 * Send email verification
 */
exports.sendVerificationEmail = async (email, token, fullName) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: `"Plated" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Plated',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ Welcome to Plated!</h1>
          </div>
          <div class="content">
            <p>Hi ${fullName},</p>
            <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
            <center>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with Plated, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Plated. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // If email service is disabled, log the verification URL
  if (!transporter) {
    console.log('📧 Email disabled. Verification URL:', verificationUrl);
    return { success: true, message: 'Email disabled (dev mode)' };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send password reset email
 */
exports.sendPasswordResetEmail = async (email, token, fullName) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  
  const mailOptions = {
    from: `"Plated" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - Plated',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset</h1>
          </div>
          <div class="content">
            <p>Hi ${fullName},</p>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Plated. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // If email service is disabled, log the reset URL
  if (!transporter) {
    console.log('📧 Email disabled. Password reset URL:', resetUrl);
    return { success: true, message: 'Email disabled (dev mode)' };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send 2FA setup email
 */
exports.send2FASetupEmail = async (email, fullName) => {
  const mailOptions = {
    from: `"Plated" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Two-Factor Authentication Enabled - Plated',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ 2FA Enabled</h1>
          </div>
          <div class="content">
            <p>Hi ${fullName},</p>
            <div class="success">
              <strong>✅ Success!</strong><br>
              Two-factor authentication has been enabled on your account.
            </div>
            <p>Your account is now more secure. You'll need to enter a verification code from your authenticator app each time you sign in.</p>
            <p><strong>Important:</strong> Make sure to save your backup codes in a safe place. You'll need them if you lose access to your authenticator app.</p>
            <p>If you didn't enable 2FA, please contact support immediately.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Plated. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // If email service is disabled, just log
  if (!transporter) {
    console.log('📧 Email disabled. 2FA notification skipped.');
    return { success: true, message: 'Email disabled (dev mode)' };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ 2FA setup email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending 2FA setup email:', error);
  }
};

/**
 * Send security alert email
 */
exports.sendSecurityAlertEmail = async (email, fullName, alertType, details) => {
  const mailOptions = {
    from: `"Plated Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Security Alert - ${alertType} - Plated`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Security Alert</h1>
          </div>
          <div class="content">
            <p>Hi ${fullName},</p>
            <div class="alert">
              <strong>Security Event Detected:</strong> ${alertType}
            </div>
            <p><strong>Details:</strong></p>
            <ul>
              ${details.map(detail => `<li>${detail}</li>`).join('')}
            </ul>
            <p><strong>What to do:</strong></p>
            <ul>
              <li>If this was you, you can ignore this email</li>
              <li>If this wasn't you, change your password immediately</li>
              <li>Enable two-factor authentication for extra security</li>
            </ul>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Plated. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // If email service is disabled, just log
  if (!transporter) {
    console.log('📧 Email disabled. Security alert skipped.');
    return { success: true, message: 'Email disabled (dev mode)' };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Security alert email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending security alert email:', error);
  }
};
