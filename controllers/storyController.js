const Story = require('../models/Story');
const User = require('../models/User');
const Follow = require('../models/Follow');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for story uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = 'uploads/stories';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'story-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed!'));
    }
  }
}).single('media');

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ 
          success: false, 
          message: 'File upload error: ' + err.message 
        });
      } else if (err) {
        return res.status(400).json({ 
          success: false, 
          message: err.message 
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a media file'
        });
      }

      // Determine media type
      const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

      // Create story
      const story = await Story.create({
        user: req.user.id,
        media: `/uploads/stories/${req.file.filename}`,
        mediaType,
        caption: req.body.caption || '',
        duration: req.body.duration || 0
      });

      const populatedStory = await Story.findById(story._id)
        .populate('user', 'name username avatar verified');

      res.status(201).json({
        success: true,
        message: 'Story created successfully',
        data: populatedStory
      });
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create story',
      error: error.message
    });
  }
};

// @desc    Get all active stories (from following users)
// @route   GET /api/stories
// @access  Private
exports.getStories = async (req, res) => {
  try {
    // Get users that current user follows
    const following = await Follow.find({ follower: req.user.id })
      .select('following');
    
    const followingIds = following.map(f => f.following);
    
    // Include current user's own stories
    followingIds.push(req.user.id);

    // Get active stories from following users
    const stories = await Story.getFollowingStories(req.user.id, followingIds);

    // Group stories by user
    const groupedStories = {};
    stories.forEach(story => {
      const userId = story.user._id.toString();
      if (!groupedStories[userId]) {
        groupedStories[userId] = {
          user: story.user,
          stories: [],
          hasUnviewed: false
        };
      }
      
      // Check if story is viewed by current user
      const viewed = story.views.some(view => 
        view.user.toString() === req.user.id.toString()
      );
      
      if (!viewed) {
        groupedStories[userId].hasUnviewed = true;
      }
      
      groupedStories[userId].stories.push(story);
    });

    // Convert to array and sort (users with unviewed stories first)
    const storiesArray = Object.values(groupedStories).sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    res.status(200).json({
      success: true,
      count: storiesArray.length,
      data: storiesArray
    });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stories',
      error: error.message
    });
  }
};

// @desc    Get user's stories
// @route   GET /api/stories/user/:userId
// @access  Private
exports.getUserStories = async (req, res) => {
  try {
    const stories = await Story.getActiveStories(req.params.userId);

    res.status(200).json({
      success: true,
      count: stories.length,
      data: stories
    });
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user stories',
      error: error.message
    });
  }
};

// @desc    Get single story
// @route   GET /api/stories/:id
// @access  Private
exports.getStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('user', 'name username avatar verified');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if expired
    if (story.isExpired()) {
      return res.status(410).json({
        success: false,
        message: 'Story has expired'
      });
    }

    // Add view
    await story.addView(req.user.id);

    res.status(200).json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch story',
      error: error.message
    });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check ownership
    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this story'
      });
    }

    // Delete media file
    try {
      if (story.media) {
        const filePath = path.join(__dirname, '..', story.media);
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error('Error deleting story file:', error);
    }

    await story.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete story',
      error: error.message
    });
  }
};

// @desc    Like/unlike story
// @route   POST /api/stories/:id/like
// @access  Private
exports.likeStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if already liked
    const likeIndex = story.likes.findIndex(
      like => like.toString() === req.user.id
    );

    if (likeIndex > -1) {
      // Unlike
      story.likes.splice(likeIndex, 1);
    } else {
      // Like
      story.likes.push(req.user.id);
    }

    await story.save();

    res.status(200).json({
      success: true,
      data: {
        likeCount: story.likes.length,
        isLiked: likeIndex === -1
      }
    });
  } catch (error) {
    console.error('Like story error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like story',
      error: error.message
    });
  }
};

// @desc    Get story views
// @route   GET /api/stories/:id/views
// @access  Private
exports.getStoryViews = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('views.user', 'name username avatar verified');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check ownership
    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view story views'
      });
    }

    res.status(200).json({
      success: true,
      count: story.views.length,
      data: story.views
    });
  } catch (error) {
    console.error('Get story views error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch story views',
      error: error.message
    });
  }
};

module.exports = exports;
