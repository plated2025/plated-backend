# 🖼️ Cloudinary Setup Guide

## What is Cloudinary?

Cloudinary is a cloud-based image and video management service. We use it to:
- Upload and store recipe images
- Upload user avatars
- Upload profile cover images
- Automatically optimize images for web
- Transform and resize images

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Free Account

1. Go to https://cloudinary.com
2. Click "Sign Up" (top right)
3. Choose "Sign up for free"
4. Fill in your details or sign up with Google/GitHub
5. Verify your email

**Free Tier Includes:**
- ✅ 25GB storage
- ✅ 25GB bandwidth/month
- ✅ Unlimited transformations
- ✅ More than enough for development!

---

### Step 2: Get Your Credentials

1. After signing in, you'll see your **Dashboard**
2. Look for the **Account Details** section (top of dashboard)
3. You'll see three important values:
   ```
   Cloud Name: your-cloud-name
   API Key: 123456789012345
   API Secret: abcdefghijklmnop123456789
   ```

---

### Step 3: Add to Backend .env

1. Open `backend/.env` file
2. Add/Update these lines:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnop123456789
```

**Replace with YOUR actual values from Step 2!**

---

### Step 4: Restart Backend Server

```bash
cd backend

# Stop the server (Ctrl+C if running)

# Start it again
npm run dev
```

You should see: `🚀 Server running on port 5000`

---

## ✅ Test It Works

### Option 1: Using the Frontend

1. Start both servers (backend + frontend)
2. Log in to your account
3. Go to Profile → Edit Profile
4. Try uploading an avatar
5. If it works → Cloudinary is configured! 🎉

### Option 2: Using Postman/Thunder Client

```
POST http://localhost:5000/api/upload/avatar
Authorization: Bearer YOUR_JWT_TOKEN
Body: form-data
  - avatar: [select an image file]
```

---

## 📁 Where Images are Stored

Cloudinary will organize images into folders:

```
plated/
├── avatars/      # User profile pictures
├── covers/       # Profile cover images
└── recipes/      # Recipe images
```

---

## 🎨 Image Processing

Our configuration automatically:
- ✅ Limits max size to 1200x1200px
- ✅ Optimizes quality
- ✅ Converts to best format (WebP when supported)
- ✅ Compresses images
- ✅ Generates CDN URLs

**Before:** `my-huge-image.jpg` (5MB)
**After:** `optimized-image.webp` (200KB) ✨

---

## 💰 Pricing (for reference)

**Free Tier** (Perfect for development):
- 25GB storage
- 25GB bandwidth
- Unlimited transformations

**Plus Plan** ($99/month when you go live):
- 160GB storage
- 290GB bandwidth
- Advanced features

**You can stay on Free tier indefinitely for development!**

---

## 🔧 Configuration Details

### File Size Limits (backend/config/cloudinary.js):
- **Avatars:** 2MB max
- **Cover Images:** 3MB max
- **Recipe Images:** 5MB max

### Accepted Formats:
- JPG/JPEG
- PNG
- GIF
- WebP

### Auto-transformations:
- Max dimensions: 1200x1200
- Quality: Auto-optimized
- Format: Auto (serves WebP to modern browsers)

---

## 📊 Monitor Usage

1. Log in to Cloudinary
2. Go to **Dashboard**
3. See real-time stats:
   - Storage used
   - Bandwidth used
   - Transformations
   - Credits remaining

---

## 🐛 Troubleshooting

### Error: "Invalid credentials"
- Check your `.env` file
- Make sure Cloud Name, API Key, and API Secret are correct
- No extra spaces or quotes
- Restart backend server

### Error: "Upload failed"
- Check file size (must be under limit)
- Check file format (JPG, PNG, GIF, WebP only)
- Check internet connection
- Check Cloudinary dashboard for errors

### Images not showing
- Check browser console for errors
- Verify image URL is from Cloudinary
- Check Cloudinary dashboard to see if image uploaded

---

## 🎯 API Endpoints

Once configured, these endpoints work:

```
POST /api/upload/recipe              # Single recipe image
POST /api/upload/recipe/multiple     # Multiple recipe images (max 5)
POST /api/upload/avatar              # User avatar
POST /api/upload/cover               # Profile cover image
DELETE /api/upload/:publicId         # Delete an image
```

All require authentication (JWT token).

---

## 📝 Example Usage in Frontend

```jsx
import ImageUpload from '../components/ImageUpload';

function MyComponent() {
  const handleImageUploaded = (url) => {
    console.log('Image uploaded:', url);
    // Save URL to database
  };

  return (
    <ImageUpload
      type="recipe"
      onImageUploaded={handleImageUploaded}
    />
  );
}
```

---

## ✨ Benefits

**Why Cloudinary vs Local Storage:**
- ✅ Automatic image optimization
- ✅ CDN (fast loading worldwide)
- ✅ Automatic backups
- ✅ No server storage needed
- ✅ Transformations (resize, crop, etc.)
- ✅ Responsive images
- ✅ Free tier is generous

---

## 🚀 You're All Set!

Your Plated app can now handle:
- ✅ Recipe image uploads
- ✅ Avatar uploads
- ✅ Cover image uploads
- ✅ Automatic optimization
- ✅ Fast CDN delivery

**Next:** Try uploading an image to test it! 📸
