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
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if the email is already registered
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ errors: [{ msg: 'Email is already registered' }] });
      }

      // Generate a random 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Create a new user instance
      user = new User({
        name,
        email,
        password,
        verificationCode,
        isVerified: false,
      });

      // Encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save the user to the database
      await user.save();

      // Send verification email to the user's registered email address
      const transporter = nodemailer.createTransport({
        // Configure the email transporter settings (e.g., SMTP)
      });

      const mailOptions = {
        from: 'your_email@example.com',
        to: email,
        subject: 'Email Verification',
        text: `Your verification code is: ${verificationCode}`,
      };


      return res.json({ msg: 'User registered successfully. Verification code sent to your email' });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);



// Generate a random 6 digit number
const verificationCode = Math.floor(100000 + Math.random() * 900000);

// Send the verification code to the user's email
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yourEmail@gmail.com',
    pass: 'yourPassword'
  }
});

let mailOptions = {
  from: 'yourEmail@gmail.com',
  to: req.body.email,
  subject: 'Verification Code',
  text: 'Your verification code is: ' + verificationCode
};

transporter.sendMail(mailOptions, function(err, data) {
  if (err) {
    console.log('Error occurs', err);
  } else {
    console.log('Email sent!');
  }
});


module.exports = router;
