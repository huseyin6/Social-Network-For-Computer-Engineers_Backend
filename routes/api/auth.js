const express = require('express');
const auth = require('../../middleware/auth');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
              res.status(200).json({ token, role: 'engineer' });
            }
          }
        );
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
