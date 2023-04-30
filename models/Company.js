const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  avatar: {
    type: String,
  },

  role: {
    type: String,
    default: 'company',
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Company = mongoose.model('company', CompanySchema);
