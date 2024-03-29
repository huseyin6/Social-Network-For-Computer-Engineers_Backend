const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(db);
    // , {
    //  useCreateIndex: true, //useCreateIndex ve useNewUrlParser true eski versiyonlarda mı kaldı yein versiyonlarda kalkmış olabilir
    //  useFindAndModify: false ?
    console.log('MongoDB Connected!');
  } catch (error) {
    console.error(error.message);
    // Exit process w/ failure
    process.exit(1);
  }
};

module.exports = connectDB;
