const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const Company = require('../../models/Company');
const config = require('config');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

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

const verificationCodes = {};

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  '/',
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
      //See if the user already exists
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
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

      // //Get users gravatar
      // const avatar = gravatar.url(email, {
      //   s: '200', // size
      //   r: 'pg', // rating
      //   d: 'mm', // default image (user icon)
      // });

      // user = new User({
      //   name,
      //   email,
      //   avatar,
      //   password,
      // });

      // //Encrypt the password
      // const salt = await bcrypt.genSalt(10);
      // user.password = await bcrypt.hash(password, salt); // Hashing the pw
      // await user.save(); // Save the user to DB

      // //Return the jsonwebtoken
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
      //       res.status(200).json({ token });
      //     }
      //   }
      // );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/users/company
// @desc    Register company
// @access  Public
router.post(
  '/company',
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
      //See if the company already exists
      let company = await Company.findOne({ email });

      if (company) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Company already exists' }] });
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

      // //Get users gravatar
      // const avatar = gravatar.url(email, {
      //   s: '200', // size
      //   r: 'pg', // rating
      //   d: 'mm', // default image (user icon)
      // });

      // company = new Company({
      //   name,
      //   email,
      //   avatar,
      //   password,
      // });

      // //Encrypt the password
      // const salt = await bcrypt.genSalt(10);
      // company.password = await bcrypt.hash(password, salt); // Hashing the pw
      // await company.save(); // Save the company to DB

      // //Return the jsonwebtoken
      // const payload = {
      //   company: {
      //     id: company.id,
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
      //       res.status(200).json({ token });
      //     }
      //   }
      // );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

function verifyCode(email, code) {
  const storedCode = verificationCodes[email];

  if (storedCode && storedCode === code) {
    return true;
  } else {
    return false;
  }
}

// @route   POST api/auth/verify-user
// @desc    Authenticate user & Get token
// @access  Public
router.post('/verify-user', async (req, res) => {
  const { name, email, password, code } = req.body;
  if (verifyCode(email, code)) {
    try {
      //Get users gravatar
      const avatar = gravatar.url(email, {
        s: '200', // size
        r: 'pg', // rating
        d: 'mm', // default image (user icon)
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      //Encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt); // Hashing the pw
      await user.save(); // Save the company to DB

      //Return the jsonwebtoken
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
      delete verificationCodes[email];
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  } else {
    return res.status(401).json({ msg: 'Invalid verification code or email' });
  }
});

// @route   POST api/auth/verify-company
// @desc    Authenticate company & Get token
// @access  Public
router.post('/verify-company', async (req, res) => {
  const { name, email, password, code } = req.body;
  if (verifyCode(email, code)) {
    try {
      //Get users gravatar
      const avatar = gravatar.url(email, {
        s: '200', // size
        r: 'pg', // rating
        d: 'mm', // default image (user icon)
      });

      company = new Company({
        name,
        email,
        avatar,
        password,
      });

      //Encrypt the password
      const salt = await bcrypt.genSalt(10);
      company.password = await bcrypt.hash(password, salt); // Hashing the pw
      await company.save(); // Save the company to DB

      //Return the jsonwebtoken
      const payload = {
        company: {
          id: company.id,
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
