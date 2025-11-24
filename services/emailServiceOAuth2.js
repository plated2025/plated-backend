const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Gmail OAuth2 Configuration (More Secure than App Passwords)
const OAuth2 = google.auth.OAuth2;

/**
 * Modern Gmail Email Service using OAuth2
 * This is more secure than using App Passwords
 * 
 * Setup Instructions:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a new project or select existing
 * 3. Enable Gmail API
 * 4. Create OAuth 2.0 credentials (Desktop app)
 * 5. Get Client ID, Client Secret
 * 6. Generate Refresh Token (see instructions below)
 */

let transporter = null;

const createTransporter = async () => {
  try {
    // Check if OAuth2 credentials are configured
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
      console.log('⚠️  Gmail OAuth2 credentials not configured');
      console.log('📧 Using fallback email service or disabling email');
      return null;
    }

    const oauth2Client = new OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground' // Redirect URL
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const accessToken = await oauth2Client.getAccessToken();

    transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    console.log('✅ Gmail OAuth2 email service is ready (Secure)');
    return transporter;

  } catch (error) {
    console.error('❌ Error setting up Gmail OAuth2:', error.message);
    console.log('📧 Email service disabled - app will continue without email functionality');
    return null;
  }
};

// Initialize transporter
(async () => {
  transporter = await createTransporter();
})();

/**
 * Send email verification
 */
exports.sendVerificationEmail = async (email, token, fullName) => {
  if (!transporter) {
    transporter = await createTransporter();
  }

  if (!transporter) {
    console.log('📧 Email disabled. Verification URL:', `${process.env.CLIENT_URL}/verify-email/${token}`);
    return { success: true, message: 'Email disabled (dev mode)' };
  }

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

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Export other email functions...
exports.sendPasswordResetEmail = async (email, token, fullName) => {
  // Similar implementation as above
};

/**
 * HOW TO GET GMAIL OAUTH2 CREDENTIALS:
 * 
 * 1. Go to Google Cloud Console:
 *    https://console.cloud.google.com/
 * 
 * 2. Create a new project:
 *    - Click "Select a project" → "New Project"
 *    - Name it "Plated App"
 * 
 * 3. Enable Gmail API:
 *    - APIs & Services → Library
 *    - Search "Gmail API" → Enable
 * 
 * 4. Create OAuth2 Credentials:
 *    - APIs & Services → Credentials
 *    - Create Credentials → OAuth client ID
 *    - Application type: Desktop app
 *    - Name: "Plated Email Service"
 *    - Download JSON (you'll get Client ID and Client Secret)
 * 
 * 5. Get Refresh Token:
 *    - Go to: https://developers.google.com/oauthplayground
 *    - Click gear icon (⚙️) → Use your own OAuth credentials
 *    - Paste your Client ID and Client Secret
 *    - In Step 1, select "Gmail API v1" → "https://mail.google.com"
 *    - Click "Authorize APIs"
 *    - Sign in with your Gmail account
 *    - Click "Exchange authorization code for tokens"
 *    - Copy the "Refresh token"
 * 
 * 6. Add to .env:
 *    GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
 *    GMAIL_CLIENT_SECRET=your-client-secret
 *    GMAIL_REFRESH_TOKEN=your-refresh-token
 *    EMAIL_USER=your-email@gmail.com
 */
