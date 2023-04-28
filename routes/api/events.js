const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

// const User = require('../../models/User');
const Event = require('../../models/Event');

// @route   POST api/events
// @desc    Create an event
// @access  Private
router.post(
  '/',
  [check('title', 'Title is required').not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newEvent = new Event({
        title: req.body.title,
        description: req.body.description,
        image: req.body.image,
        date: req.body.date,
        location: req.body.location,
      });

      const event = await newEvent.save();

      res.status(200).json(event);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/events
// @desc    Get all events
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.status(200).json(events);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/events/:id
// @desc    Get event by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(400).json({ msg: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/events/attend/:id
// @desc    Attend an event
// @access  Private
router.put('/attend/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    // Event dolu mu
    if (event.attendeeCount >= event.capacity) {
      return res.status(400).json({ msg: 'Event Full' });
    }

    // Evente katılıp katılmadığını kontrol et
    if (
      event.attendees.filter(
        (attendees) => attendees.user.toString() === req.user.id
      ).length > 0
    ) {
      return res
        .status(400)
        .json({ msg: 'You Have Already Attended This Event' });
    } else {
      event.attendees.unshift({ user: req.user.id });
      event.attendeeCount += 1;
    }

    await event.save();

    res.status(200).json(event.attendees);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
