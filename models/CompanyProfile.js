const mongoose = require('mongoose');

const CompanyProfileSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'company' },
  website: { type: String },
  location: { type: String },
  about: { type: String },

  social: {
    youtube: { type: String },
    twitter: { type: String },
    facebook: { type: String },
    linkedin: { type: String },
    instagram: { type: String },
  },

  date: { type: Date, default: Date.now },
});

module.exports = CompanyProfile = mongoose.model(
  'companyprofile',
  CompanyProfileSchema
);
