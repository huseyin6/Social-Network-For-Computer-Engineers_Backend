const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();

// Connect DB
connectDB();

const corsOptions = {
  origin: '*',
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

// Init middleware
// Use cors
app.use(cors(corsOptions));
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/questions', require('./routes/api/questions'));
app.use('/api/events', require('./routes/api/events'));
app.use('/api/companyprofile', require('./routes/api/companyprofile'));
app.use('/api/job', require('./routes/api/job'));
app.use('/api/recommendations', require('./routes/api/recommendations'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
