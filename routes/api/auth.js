const express = require('express');
const auth = require('../../middleware/auth');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../../models/User');

// @route   GET api/auth
// @desc    Test Route
// @access  Public
router.get('/', auth, async (req, res) => {
  try {
    // res.send('Auth route')
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!!!');
  }
});

// @route   POST api/auth
// @desc    Authenticate user & Get token
// @access  Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 3600 }, // 1 hour expire time
        (error, token) => {
          if (error) {
            throw error;
          } else {
            res.status(200).json({ token });
          }
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
