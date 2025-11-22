const Comment = require('../models/Comment');
const Recipe = require('../models/Recipe');
const { createNotification } = require('./notificationController');

// @desc    Get comments for a recipe
// @route   GET /api/comments/recipe/:recipeId
// @access  Public
exports.getRecipeComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      recipe: req.params.recipeId,
      parentComment: null // Only top-level comments
    })
      .populate('user', 'fullName username avatar isVerified')
      .sort('-createdAt');

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .populate('user', 'fullName username avatar isVerified')
          .sort('createdAt');

        return {
          ...comment.toObject(),
          replies
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: commentsWithReplies
    });
  } catch (error) {
    console.error('Get recipe comments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching comments',
      error: error.message
    });
  }
};

// @desc    Add comment to recipe
// @route   POST /api/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { recipe, text, parentComment } = req.body;

    // Verify recipe exists
    const recipeExists = await Recipe.findById(recipe);
    if (!recipeExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipe not found'
      });
    }

    // If it's a reply, verify parent comment exists
    if (parentComment) {
      const parentExists = await Comment.findById(parentComment);
      if (!parentExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Parent comment not found'
        });
      }
    }

    const comment = await Comment.create({
      recipe,
      user: req.user.id,
      text,
      parentComment: parentComment || null
    });

    // Populate user data
    await comment.populate('user', 'fullName username avatar isVerified');

    // Send notification
    if (parentComment) {
      // Reply to comment - notify comment author
      const parentCommentData = await Comment.findById(parentComment).populate('user');
      if (parentCommentData && parentCommentData.user._id.toString() !== req.user.id) {
        await createNotification(
          parentCommentData.user._id,
          req.user.id,
          'reply',
          'New Reply',
          `${req.user.fullName} replied to your comment`,
          { recipeId: recipe, commentId: comment._id, link: `/recipe/${recipe}` }
        );
      }
    } else {
      // New comment - notify recipe creator
      if (recipeExists.creator.toString() !== req.user.id) {
        await createNotification(
          recipeExists.creator,
          req.user.id,
          'comment',
          'New Comment',
          `${req.user.fullName} commented on your recipe "${recipeExists.title}"`,
          { recipeId: recipe, commentId: comment._id, link: `/recipe/${recipe}` }
        );
      }
    }

    res.status(201).json({
      status: 'success',
      data: comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }

    // Make sure user is comment owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this comment'
      });
    }

    comment.text = req.body.text;
    comment.isEdited = true;
    comment.editedAt = Date.now();

    await comment.save();

    res.status(200).json({
      status: 'success',
      data: comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating comment',
      error: error.message
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }

    // Make sure user is comment owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this comment'
      });
    }

    // Delete all replies if it's a parent comment
    if (!comment.parentComment) {
      await Comment.deleteMany({ parentComment: comment._id });
    }

    await comment.deleteOne();

    // Update comment count
    if (!comment.parentComment) {
      await Recipe.findByIdAndUpdate(comment.recipe, {
        $inc: { commentsCount: -1 }
      });
    } else {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $inc: { repliesCount: -1 }
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting comment',
      error: error.message
    });
  }
};

// @desc    Like/Unlike comment
// @route   POST /api/comments/:id/like
// @access  Private
exports.toggleCommentLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }

    const isLiked = comment.likesUsers.includes(req.user.id);

    if (isLiked) {
      // Unlike
      comment.likesUsers = comment.likesUsers.filter(
        userId => userId.toString() !== req.user.id
      );
      comment.likes -= 1;
    } else {
      // Like
      comment.likesUsers.push(req.user.id);
      comment.likes += 1;
    }

    await comment.save();

    res.status(200).json({
      status: 'success',
      data: {
        isLiked: !isLiked,
        likes: comment.likes
      }
    });
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error toggling comment like',
      error: error.message
    });
  }
};
