# 📧 Email Service Setup Guide

## 🎯 Quick Start (Gmail)

The easiest way to enable email functionality is using Gmail with an App Password.

---

## 📋 Step-by-Step Gmail Setup

### **1. Create Gmail App Password**

1. **Go to Google Account Security:**
   - Visit: https://myaccount.google.com/security
   - Make sure you're logged into the Gmail account you want to use

2. **Enable 2-Step Verification** (if not already):
   - Search for "2-Step Verification" in settings
   - Click **Get Started** and follow the wizard
   - Verify your phone number

3. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Or search for "App passwords" in your Google Account settings
   - **Select app:** Mail
   - **Select device:** Other (Custom name)
   - **Enter name:** Plated App
   - Click **Generate**
   - **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)
   - Remove spaces: `abcdefghijklmnop`

---

### **2. Add to Your .env File**

Add these lines to your `.env` file:

```env
# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=Plated <your-email@gmail.com>
```

**Real Example:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=plated.noreply@gmail.com
EMAIL_PASSWORD=xyzw1234abcd5678
EMAIL_FROM=Plated <plated.noreply@gmail.com>
```

---

### **3. Add to Render (Production)**

1. Go to your **Render Backend Service**
2. Click **Environment** tab
3. Add these environment variables:

```
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = your-16-char-app-password
EMAIL_FROM = Plated <your-email@gmail.com>
```

4. Click **Save Changes**
5. Render will automatically redeploy

---

### **4. Test Email Service**

1. **Restart your backend server:**
   ```bash
   npm run dev
   ```

2. **Look for success message in logs:**
   ```
   ✅ Email service is ready
   ```

3. **Test by signing up a new user:**
   - Go to your app
   - Sign up with a new email
   - Check inbox for verification email

---

## 🚀 Production Email Providers (Recommended)

For production, use a dedicated email service instead of Gmail:

### **Option 1: SendGrid (Best for Apps)**

**Pros:** Free tier (100 emails/day), reliable, great deliverability

1. **Sign up:** https://sendgrid.com/
2. **Get API Key:** Settings → API Keys → Create API Key
3. **Add to .env:**

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=Plated <noreply@plated.cloud>
```

**Free Tier:**
- 100 emails/day forever
- 40,000 emails first 30 days
- Email analytics included

---

### **Option 2: AWS SES (Best for Scale)**

**Pros:** Cheapest at scale ($0.10 per 1,000 emails), highly reliable

1. **Sign up:** https://aws.amazon.com/ses/
2. **Verify domain or email**
3. **Get SMTP credentials**
4. **Add to .env:**

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-aws-smtp-username
EMAIL_PASSWORD=your-aws-smtp-password
EMAIL_FROM=Plated <noreply@plated.cloud>
```

**Pricing:**
- First 62,000 emails/month: FREE (if sent from EC2)
- After that: $0.10 per 1,000 emails

---

### **Option 3: Mailgun (Developer Friendly)**

**Pros:** Easy setup, good documentation

1. **Sign up:** https://www.mailgun.com/
2. **Add and verify domain**
3. **Get SMTP credentials**
4. **Add to .env:**

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
EMAIL_FROM=Plated <noreply@plated.cloud>
```

**Free Tier:**
- 5,000 emails/month for 3 months
- Then pay-as-you-go

---

### **Option 4: Resend (Modern & Simple)**

**Pros:** Modern API, easy to use, good free tier

1. **Sign up:** https://resend.com/
2. **Get API key**
3. **Add domain**
4. **Add to .env:**

```env
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=resend
EMAIL_PASSWORD=your-resend-api-key
EMAIL_FROM=Plated <noreply@plated.cloud>
```

**Free Tier:**
- 3,000 emails/month
- 100 emails/day

---

## 📊 Comparison Table

| Provider | Free Tier | Best For | Setup Difficulty |
|----------|-----------|----------|------------------|
| **Gmail** | 500/day | Development | ⭐ Easy |
| **SendGrid** | 100/day | Small apps | ⭐⭐ Medium |
| **AWS SES** | 62k/month | High volume | ⭐⭐⭐ Complex |
| **Mailgun** | 5k/month | Medium apps | ⭐⭐ Medium |
| **Resend** | 3k/month | Modern apps | ⭐ Easy |

---

## 🔍 Troubleshooting

### **Error: "Invalid login: 535-5.7.8 Username and Password not accepted"**

**Solution:**
- Make sure you're using an **App Password**, not your regular Gmail password
- Remove spaces from the app password
- Enable "Less secure app access" (not recommended)

---

### **Error: "connect ETIMEDOUT"**

**Solution:**
- Check your firewall isn't blocking port 587
- Try port 465 with `secure: true`:
  ```env
  EMAIL_PORT=465
  ```

---

### **Error: "Certificate error" or "self-signed certificate"**

**Solution:**
- Add `tls: { rejectUnauthorized: false }` to transporter config
- Or update your Node.js version

---

### **Emails going to spam**

**Solutions:**
1. **Verify your domain** with SPF and DKIM records
2. **Use a professional email service** (SendGrid, AWS SES)
3. **Add sender authentication**
4. **Don't use Gmail for production** (use dedicated service)

---

### **Email service disabled message**

If you see this in logs:
```
⚠️ Email credentials not configured
📧 Email service disabled - app will continue without email functionality
```

**This is OK for development!** The app works fine without emails.

**To enable:**
- Add `EMAIL_USER` and `EMAIL_PASSWORD` to your `.env`
- Restart the server

---

## ✅ Email Features in Plated

Once configured, your app will automatically send:

### **1. Welcome/Verification Emails**
- Sent when users sign up
- Contains verification link
- Link expires in 24 hours

### **2. Password Reset Emails**
- Sent when users request password reset
- Contains secure reset link
- Link expires in 1 hour

### **3. Security Alerts**
- Unusual login attempts
- Password changes
- 2FA changes
- Account settings updates

### **4. 2FA Setup Confirmations**
- Sent when 2FA is enabled
- Contains backup codes
- Security reminder

---

## 🎨 Email Templates

All emails use beautiful HTML templates with:
- ✅ Responsive design
- ✅ Brand colors (purple gradient)
- ✅ Clear call-to-action buttons
- ✅ Mobile-friendly layout
- ✅ Security icons and warnings

---

## 🔒 Security Best Practices

### **For Gmail:**
1. ✅ Use App Passwords (never regular password)
2. ✅ Enable 2-Step Verification
3. ✅ Use dedicated email account (not personal)
4. ✅ Monitor account activity

### **For Production:**
1. ✅ Use dedicated email service (SendGrid, AWS SES)
2. ✅ Verify your domain
3. ✅ Set up SPF, DKIM, and DMARC records
4. ✅ Monitor bounce and complaint rates
5. ✅ Use environment variables (never hardcode)

---

## 📝 Testing Checklist

After setup, test these flows:

- [ ] Sign up new user → Verify email received
- [ ] Click verification link → Account activated
- [ ] Request password reset → Email received
- [ ] Click reset link → Can change password
- [ ] Enable 2FA → Confirmation email received
- [ ] Check spam folder (emails shouldn't be there)

---

## 🆘 Still Having Issues?

### **Option 1: Use Ethereal Email (Testing)**

For development, use Ethereal to test emails without a real SMTP:

```javascript
// In emailService.js, add this for testing:
const testAccount = await nodemailer.createTestAccount();
const transporter = nodemailer.createTransporter({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: testAccount.user,
    pass: testAccount.pass
  }
});
```

View sent emails at: https://ethereal.email/

---

### **Option 2: Disable Email Temporarily**

Simply don't add email variables to `.env`. The app will continue working without email functionality.

---

### **Option 3: Contact Support**

- Gmail Support: support.google.com
- SendGrid Support: support.sendgrid.com
- AWS SES Support: aws.amazon.com/ses/

---

## 🚀 Quick Commands

### **Test email locally:**
```bash
# Start backend
cd backend
npm run dev

# Look for this in logs:
# ✅ Email service is ready
```

### **Check email service status:**
```bash
# Should show "Email service is ready" or "Email service disabled"
```

### **Update production email:**
```bash
# 1. Update Render environment variables
# 2. Service auto-redeploys
# 3. Check logs for "✅ Email service is ready"
```

---

## 📊 Monitoring

### **Things to Monitor:**

1. **Delivery Rate** - % of emails successfully delivered
2. **Bounce Rate** - Should be < 5%
3. **Complaint Rate** - Should be < 0.1%
4. **Open Rate** - Varies by email type

### **Tools:**

- SendGrid Dashboard
- AWS SES Dashboard
- Mailgun Analytics
- Google Postmaster Tools

---

**Email service is optional but recommended for production!** 🎉

For development, you can skip email setup and the app will work fine.
