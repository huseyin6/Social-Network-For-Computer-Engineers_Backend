const express = require('express');
const auth = require('../../middleware/auth');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const User = require('../../models/User');
const Company = require('../../models/Company');


// @route   GET api/auth
// @desc    Test Route
// @access  Public
router.get('/', auth, async (req, res) => {
  try {
    // res.send('Auth route')
    // console.log(req);

    if (req.user) {
      const user = await User.findById(req.user.id).select('-password');
      return res.json(user);
    } else {
      const company = await Company.findById(req.company.id).select(
        '-password'
      );
      return res.json(company);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!!!');
  }
});

// @route   POST api/auth/verify-email
// @desc    Verify user's email
// @access  Public
router.post('/verify-email', async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    // Check if the provided verification code matches the stored code
    if (verificationCode !== user.verificationCode) {
      return res.status(400).json({ msg: 'Invalid verification code' });
    }

    // Update the user's status to "verified"
    user.isVerified = true;
    await user.save();

    return res.json({ msg: 'Email verification successful' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});


// @route   POST api/auth
// @desc    Authenticate engineer or company & Get token
// @access  Public
// @route   POST api/auth
// @desc    Authenticate engineer or company & Get token
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
        let company = await Company.findOne({ email });
        if (!company) {
          return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        const isMatchCompany = await bcrypt.compare(password, company.password);
        if (!isMatchCompany) {
          return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        const payloadCompany = {
          company: {
            id: company.id,
          },
        };

        jwt.sign(
          payloadCompany,
          config.get('jwtSecret'),
          { expiresIn: 3600 }, // 1 hour expire time
          (error, token) => {
            if (error) throw error;
            return res.status(200).json({ token, role: 'company' });
          }
        );
      } else {
        // Ensure user has verified their email
        if (!user.isVerified) {
          return res.status(400).json({ errors: [{ msg: 'Email not verified' }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
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
            if (error) throw error;
            res.status(200).json({ token, role: 'engineer' });
          }
        );
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        name,
        email,
        password,
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      user.verificationCode = verificationCode; // add a field to your User schema for this

      await user.save();

      // Nodemailer configuration
      let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // Replace with your SMTP server
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: 'c^3@app.com', // Replace with your email
          pass: 'c32023c3' // Replace with your email password
        }
      });
      
      let mailOptions = {
        from: '"C^3" <no-reply@C^3.com>', // sender address, // sender address
        to: email, // user's email
        subject: 'Verification Code',
        text: 'Your verification code is: ' + verificationCode
      };
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
      });
      
      res.send('User registered. Verification email sent.');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// POST request to /verify
router.post(
  '/verify',
  [
    // Validation: check that the provided code is a number with 6 digits
    check('code', 'Verification code must be a number with 6 digits')
      .isNumeric()
      .isLength({ min: 6, max: 6 }),
    check('userId', 'User ID is required')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, code } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid user' }] });
      }

      if (user.verificationCode !== code) {
        // Increment the verification attempts count and save
        user.verificationAttempts++;
        await user.save();

        // Limit the number of attempts (in this case, 5)
        if (user.verificationAttempts >= 5) {
          return res.status(429).json({ errors: [{ msg: 'Too many attempts. Please try again later.' }] });
        } else {
          return res.status(400).json({ errors: [{ msg: 'Invalid verification code' }] });
        }
      }

      // If the code is correct, mark the user as verified and reset the attempts count
      user.verificationCode = null;
      user.verificationAttempts = 0;
      user.isVerified = true; // Add this field to your User schema
      await user.save();

      return res.json({ msg: 'User verified successfully' });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);


module.exports = router;
