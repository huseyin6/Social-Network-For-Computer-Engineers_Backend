const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const Company = require('../../models/Company');
const Profile = require('../../models/Profile');
const CompanyProfile = require('../../models/CompanyProfile');
const config = require('config');

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
      await user.save(); // Save the user to DB

      //Return the jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      const profileFields = {};
        profileFields.user = user.id;
        profileFields.company = '';
        profileFields.website = '';
        profileFields.mail = '';
        profileFields.location = '';
        profileFields.bio = '';
        profileFields.status = '';
        profileFields.skills = [];

        profileFields.social = {};
        profileFields.social.youtube = '';
        profileFields.social.twitter = '';
        profileFields.social.facebook = '';
        profileFields.social.linkedin = '';
        profileFields.social.instagram = '';
        profileFields.social.github = '';

      let profile = new Profile(profileFields);
      await profile.save();

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

      const profileFields = {};
      profileFields.company = company.id;
      profileFields.website = '';
      profileFields.location = '';
      profileFields.about = '';
      
      profileFields.social = {};
      profileFields.social.youtube = '';
      profileFields.social.twitter = '';
      profileFields.social.facebook = '';
      profileFields.social.linkedin = '';
      profileFields.social.instagram = '';

      let profile = new CompanyProfile(profileFields);

      await profile.save();
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
