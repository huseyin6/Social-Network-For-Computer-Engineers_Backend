const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'companies' },
  title: { type: String, required: true },
  status: { type: String, required: true },
  description: { type: String, required: true },
  applicants: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
      },
    },
  ],
  declinedUsers: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
      },
    },
  ],

  date: { type: Date, default: Date.now },
});

module.exports = Job = mongoose.model('job', JobSchema);
