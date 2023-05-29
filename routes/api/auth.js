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

        // to this
        jwt.sign(
          payload,
          process.env.JWT_SECRET,
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

      // Generate a six-digit code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      user.verificationCode = verificationCode;

      await user.save();

      // Nodemailer configuration
      let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', 
        port: 587,
        secure: false, 
        auth: {
          user: process.env.EMAIL_USER, 
          pass: process.env.EMAIL_PASSWORD, 
        }
      });
      
      // Mail options
      let mailOptions = {
        from: '"c^3" <c^3@gmail.com>', // sender address
        to: email, // receiver address
        subject: 'Verification Code', // Subject line
        text: `Your verification code is: ${verificationCode}`, // plain text body
      };

      console.log(mailOptions.text);

      // send mail
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log('Error sending email:', err);
          return res.status(500).json({ msg: 'Error sending email', error: err.message });
        } else {
          console.log('Email sent: ' + info.response);
          res.status(200).json({ msg: 'Verification email sent' });
        }
      });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);





module.exports = router;
