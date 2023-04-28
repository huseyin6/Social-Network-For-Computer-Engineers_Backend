const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  attendees: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
  },
  time: {
    type: String,
  },
  capacity: {
    type: Number,
    default: 200,
  },
  attendeeCount: {
    type: Number,
    default: 0,
  },
});

module.exports = Event = mongoose.model('event', EventSchema);
