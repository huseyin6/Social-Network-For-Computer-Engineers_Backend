const express = require('express');
const auth = require('../../middleware/auth');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

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

const mailer = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: 'ccube.team@outlook.com',
    pass: 'ccubeservice.team.416',
  },
});

function sendVerificationCode(email, code, callback) {
  const mailOptions = {
    from: 'ccube.team@outlook.com',
    to: email,
    subject: 'C Cube Verification Code',
    text: `Your verification code is: ${code}`,
  };

  mailer.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      callback(false);
    } else {
      console.log('Verification code email sent');
      callback(true);
    }
  });
}

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
        // console.log(company);

        if (!company) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'Invalid Credentials' }] });
        }
        const isMatchCompany = await bcrypt.compare(password, company.password);
        if (!isMatchCompany) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        const code = randomstring.generate({
          length: 6,
          charset: 'numeric',
        });

        sendVerificationCode(email, code, function (isSent) {
          if (isSent) {
            verificationCodes[email] = code;
            return res
              .status(200)
              .json({ msg: 'Verification code has just sent!' });
          } else {
            return res.status(400).json({
              errors: [{ msg: 'An error occurred while sending the mail' }],
            });
          }
        });

        // const payloadCompany = {
        //   company: {
        //     id: company.id,
        //   },
        // };

        // jwt.sign(
        //   payloadCompany,
        //   config.get('jwtSecret'),
        //   { expiresIn: 3600 }, // 1 hour expire time
        //   (error, token) => {
        //     if (error) {
        //       throw error;
        //     } else {
        //       return res.status(200).json({ token, role: 'company' });
        //     }
        //   }
        // );
      } else {
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        const code = randomstring.generate({
          length: 6,
          charset: 'numeric',
        });

        sendVerificationCode(email, code, function (isSent) {
          if (isSent) {
            verificationCodes[email] = code;
            return res
              .status(200)
              .json({ msg: 'Verification code has just sent!' });
          } else {
            return res.status(400).json({
              errors: [{ msg: 'An error occurred while sending the mail' }],
            });
          }
        });

        // const payload = {
        //   user: {
        //     id: user.id,
        //   },
        // };

        // jwt.sign(
        //   payload,
        //   config.get('jwtSecret'),
        //   { expiresIn: 3600 }, // 1 hour expire time
        //   (error, token) => {
        //     if (error) {
        //       throw error;
        //     } else {
        //       res.status(200).json({ token, role: 'engineer' });
        //     }
        //   }
        // );
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

const verificationCodes = {};

function verifyCode(email, code) {
  const storedCode = verificationCodes[email];

  if (storedCode && storedCode === code) {
    return true;
  } else {
    return false;
  }
}

// @route   POST api/auth/verify
// @desc    Authenticate engineer or company & Get token
// @access  Public
router.post('/verify', async (req, res) => {
  const { email, code } = req.body;
  console.log(verificationCodes);
  if (verifyCode(email, code)) {
    try {
      let user = await User.findOne({ email });

      if (!user) {
        let company = await Company.findOne({ email });
        // console.log(company);

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
            if (error) {
              throw error;
            } else {
              return res.status(200).json({ token, role: 'company' });
            }
          }
        );
      } else {
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
              res.status(200).json({ token, role: 'engineer' });
            }
          }
        );
      }
      delete verificationCodes[email];
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  } else {
    return res.status(401).json({ msg: 'Invalid verification code or email' });
  }
});

module.exports = router;
