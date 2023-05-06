const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const Job = require('../../models/Job');
const Profile = require('../../models/Profile');

// @route   GET api/recommendations
// @desc    Get recommended jobs for a user
// @access  Private
router.get('/', auth, async (req, res) => {
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
    });

    res.status(200).json(recommendedJobs);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
