const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'company' },
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
  endDate: { type: Date, required: true },
});

JobSchema.index({ title: 'text', description: 'text' });
module.exports = Job = mongoose.model('job', JobSchema);
