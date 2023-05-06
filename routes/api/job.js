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

// @route   GET api/job/myads
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

// @route   GET api/job/recommendations
// @desc    Get recommended jobs for a user
// @access  Private
router.get('/recommendations', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }

    const experienceTitles = profile.experience.map((exp) => exp.title);
    const skills = profile.skills;

    const searchKeywords = [...experienceTitles, ...skills];

    const recommendedJobs = await Job.find({
      $or: [
        {
          title: { $in: searchKeywords },
        },
        {
          description: { $in: searchKeywords },
        },
      ],
    }).where('declinedUsers.user').ne(req.user.id); // Exclude jobs that the user has declined

    res.status(200).json(recommendedJobs);
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

// @route   PUT api/job/apply/:id
// @desc    Apply a job
// @access  Private
router.put('/apply/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    // Check if the job has already been applied
    if (
      job.applicants.filter(
        (applicant) => applicant.user.toString() == req.user.id
      ).length > 0
    ) {
      // const removeIndex = job.applicants
      //   .map((applicant) => applicant.user.toString())
      //   .indexOf(req.user.id);

      // job.applicants.splice(removeIndex, 1);

      return res.status(400).json({ msg: 'Job has already been applied' });
    } else {
      job.applicants.unshift({ user: req.user.id });
    }

    await job.save();

    res.status(200).json(job.applicants);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/job/decline/:id
// @desc    Decline a job
// @access  Private
router.put('/decline/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    // Check if the job has already been declined
    if (
      job.declinedUsers.filter(
        (user) => user.user.toString() == req.user.id
      ).length > 0
    ) {
      return res.status(400).json({ msg: 'Job has already been declined' });
    } else {
      job.declinedUsers.unshift({ user: req.user.id });
    }

    await job.save();

    res.status(200).json(job.declinedUsers);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});


// @route   GET api/job/applicants/:id
// @desc    Get all applicants
// @access  Private
router.get('/applicants/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    res.status(200).json(job.applicants);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
