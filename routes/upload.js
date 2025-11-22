const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  recipeImageUpload,
  avatarUpload,
  coverImageUpload
} = require('../config/cloudinary');
const {
  uploadRecipeImage,
  uploadMultipleRecipeImages,
  uploadAvatar,
  uploadCoverImage,
  deleteUploadedImage
} = require('../controllers/uploadController');

// All upload routes are protected
router.use(protect);

// Recipe image uploads
router.post('/recipe', recipeImageUpload.single('image'), uploadRecipeImage);
router.post('/recipe/multiple', recipeImageUpload.array('images', 5), uploadMultipleRecipeImages);

// User image uploads
router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar);
router.post('/cover', coverImageUpload.single('cover'), uploadCoverImage);

// Delete image
router.delete('/:publicId', deleteUploadedImage);

module.exports = router;
