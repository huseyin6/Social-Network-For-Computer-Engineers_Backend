const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Job = require('../../models/Job');
const Company = require('../../models/Company');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route   POST api/job
// @desc    Advertise Job
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('status', 'Status is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const company = await Company.findById(req.company.id).select(
        '-password'
      );

      const newJob = new Job({
        company: req.company.id,
        title: req.body.title,
        status: req.body.status,
        description: req.body.description,
      });

      // Advertise Job
      const job = await newJob.save();
      res.status(200).json(job);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/myads
// @desc    Get all My Ads
// @access  Private
router.get('/myads', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ company: req.company.id });
    res.status(200).json(jobs);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/job/
// @desc    Recommend Job Advertisements to engineer
// @access  Private
router.get('/recommendations', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });

    const status = profile.status;

    const recommendations = await Job.find({ status: status });

    if (!recommendations) {
      return res.status(400).json({
        msg: 'Currently, there is no job ad that we can show you specifically.',
      });
    }

    res.status(200).json(recommendations);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/job/:id
// @desc    Delete Job
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(400).json({ msg: 'Job not found' });
    }

    // Check user
    if (job.company.toString() != req.company.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await job.remove();

    res.status(200).json({ msg: 'Job deleted' });
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
