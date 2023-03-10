const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Question = require('../../models/Question');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   POST api/questions
// @desc    Create a question
// @access  Private
router.post(
  '/',
  [auth, [check('description', 'Description is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newQuestion = new Question({
        description: req.body.description,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
        code: req.body.code,
        language: req.body.language,
      });

      const question = await newQuestion.save();

      res.status(200).json(question);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/questions
// @desc    Get all questions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const questions = await Question.find().sort({ date: -1 });
    res.status(200).json(questions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/questions/:id
// @desc    Get question by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(400).json({ msg: 'Question not found' });
    }

    res.status(200).json(question);
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/questions/:id
// @desc    Delete a question
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(400).json({ msg: 'Question not found' });
    }

    // Check user
    if (question.user.toString() != req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await question.remove();

    res.status(200).json({ msg: 'Question deleted' });
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/questions/like/:id
// @desc    Like a question
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    // Check if the post has already been liked
    if (
      question.likes.filter((like) => like.user.toString() == req.user.id)
        .length > 0
    ) {
      return res.status(400).json({ msg: 'Question already liked' });
    }

    question.likes.unshift({ user: req.user.id });

    await question.save();

    res.status(200).json(question.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/questions/comment/:id
// @desc    Comment on a question
// @access  Private
router.post(
  '/comment/:id',
  [auth, [check('description', 'Description is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const question = await Question.findById(req.params.id);

      const newComment = new Question({
        description: req.body.description,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      question.comments.unshift(newComment);

      await question.save();

      res.status(200).json(question.comments);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete on a comment
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    // Pull out comment
    const comment = question.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exists' });
    }

    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Get the remove index
    const removeIndex = question.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    question.comments.splice(removeIndex, 1);

    await question.save();

    res.status(200).json(question.comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
