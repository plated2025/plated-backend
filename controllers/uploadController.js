const { deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');
const User = require('../models/User');
const Recipe = require('../models/Recipe');

// @desc    Upload recipe image
// @route   POST /api/upload/recipe
// @access  Private
exports.uploadRecipeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        url: req.file.path,
        publicId: req.file.filename
      }
    });
  } catch (error) {
    console.error('Upload recipe image error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error uploading image',
      error: error.message
    });
  }
};

// @desc    Upload multiple recipe images
// @route   POST /api/upload/recipe/multiple
// @access  Private
exports.uploadMultipleRecipeImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files uploaded'
      });
    }

    const images = req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    }));

    res.status(200).json({
      status: 'success',
      data: images
    });
  } catch (error) {
    console.error('Upload multiple images error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error uploading images',
      error: error.message
    });
  }
};

// @desc    Upload avatar
// @route   POST /api/upload/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    // Delete old avatar if exists
    const user = await User.findById(req.user.id);
    if (user.avatar && user.avatar.includes('cloudinary.com')) {
      const oldPublicId = getPublicIdFromUrl(user.avatar);
      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    // Update user avatar
    user.avatar = req.file.path;
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        url: req.file.path,
        publicId: req.file.filename
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error uploading avatar',
      error: error.message
    });
  }
};

// @desc    Upload cover image
// @route   POST /api/upload/cover
// @access  Private
exports.uploadCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    // Delete old cover image if exists
    const user = await User.findById(req.user.id);
    if (user.coverImage && user.coverImage.includes('cloudinary.com')) {
      const oldPublicId = getPublicIdFromUrl(user.coverImage);
      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    // Update user cover image
    user.coverImage = req.file.path;
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        url: req.file.path,
        publicId: req.file.filename
      }
    });
  } catch (error) {
    console.error('Upload cover image error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error uploading cover image',
      error: error.message
    });
  }
};

// @desc    Delete image
// @route   DELETE /api/upload/:publicId
// @access  Private
exports.deleteUploadedImage = async (req, res) => {
  try {
    const publicId = req.params.publicId.replace(/-/g, '/');
    await deleteImage(publicId);

    res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting image',
      error: error.message
    });
  }
};
