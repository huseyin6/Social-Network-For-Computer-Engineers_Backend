const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const CompanyProfile = require('../../models/CompanyProfile');
const Company = require('../../models/Company');

const request = require('request');
const config = require('config');

// @route   GET api/companyprofile/us
// @desc    Get Current Users Profile
// @access  Private
router.get('/us', auth, async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({
      company: req.company.id,
    }).populate('company', ['name', 'avatar']);

    if (!profile) {
      return res
        .status(400)
        .json({ msg: 'There is no profile for this company' });
    }
    res.status(200).json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/companyprofile
// @desc    Get all company profiles
// @access  Public
router.get('/', async (req, res) => {
  try {
    const profiles = await CompanyProfile.find().populate('company', [
      'name',
      'avatar',
    ]);
    res.status(200).json(profiles);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/companyprofile
// @desc    Create or Update Company Profile
// @access  Private
router.post('/', auth, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    website,
    location,
    about,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin,
  } = req.body;

  const profileFields = {};
  profileFields.company = req.company.id;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (about) profileFields.about = about;
  // res.send('Profile Route');

  // ctrl+shift+l

  // Build social object
  profileFields.social = {};
  if (youtube) profileFields.social.youtube = youtube;
  if (twitter) profileFields.social.twitter = twitter;
  if (facebook) profileFields.social.facebook = facebook;
  if (linkedin) profileFields.social.linkedin = linkedin;
  if (instagram) profileFields.social.instagram = instagram;

  try {
    let profile = await CompanyProfile.findOne({ company: req.company.id });

    // Update profile
    if (profile) {
      profile = await CompanyProfile.findOneAndUpdate(
        { company: req.company.id },
        { $set: profileFields },
        { new: true }
      );

      return res.status(200).json(profile);
    }

    // Create profile
    profile = new CompanyProfile(profileFields);
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/companyprofile/company/:company_id
// @desc    Get profile by user ID
// @access  Public
router.get('/company/:company_id', async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({
      company: req.params.company_id,
    }).populate('company', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error(error.message);

    if (error.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }

    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/companyprofile
// @desc    Delete company profile & company
// @access  Private
router.delete('/', auth, async (req, res) => {
  // Since method private(we have accessed the token), we actually add auth middleware auth
  // TO-DO: Remove users posts also
  try {
    // Remove profile
    await CompanyProfile.findOneAndRemove({ company: req.company.id });
    // Remove user
    await Company.findOneAndRemove({ _id: req.company.id });
    res.status(200).json({ msg: 'Company deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
