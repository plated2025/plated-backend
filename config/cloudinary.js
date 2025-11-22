const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage configuration for different file types
const createStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `plated/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    }
  });
};

// Multer configurations
const recipeImageUpload = multer({
  storage: createStorage('recipes'),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const avatarUpload = multer({
  storage: createStorage('avatars'),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

const coverImageUpload = multer({
  storage: createStorage('covers'),
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB
  }
});

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const publicId = filename.split('.')[0];
  const folder = parts[parts.length - 2];
  return `plated/${folder}/${publicId}`;
};

module.exports = {
  cloudinary,
  recipeImageUpload,
  avatarUpload,
  coverImageUpload,
  deleteImage,
  getPublicIdFromUrl
};
