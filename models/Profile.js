const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  company: { type: String },
  website: { type: String },
  mail: { type: String },
  location: { type: String },
  status: { type: String },
  skills: { type: [String] },
  bio: { type: String },
  scores: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
      score: {
        type: Number,
      },
    },
  ],

  avgScore: { type: Number, default: 0 },
  scoreCount: { type: Number, default: 0 },

  experience: [
    {
      title: { type: String, required: true },
      company: { type: String, required: true },
      location: { type: String },
      from: { type: Date, required: true },
      to: { type: Date },
      current: { type: Boolean, default: false },
      description: { type: String },
    },
  ],

  education: [
    {
      school: { type: String, required: true },
      degree: { type: String, required: true },
      fieldofstudy: { type: String, required: true },
      from: { type: Date, required: true },
      to: { type: Date },
      current: { type: Boolean, default: false },
      description: { type: String },
    },
  ],

  social: {
    youtube: { type: String },
    twitter: { type: String },
    facebook: { type: String },
    linkedin: { type: String },
    instagram: { type: String },
    github: {type: String},
  },

  date: { type: Date, default: Date.now },
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);
