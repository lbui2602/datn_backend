const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const workingDayRoutes = require('./routes/workingDayRoutes');
const roleRoutes = require('./routes/roleRoutes');

const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();


const app = express();
const port = 3000;

// Kết nối tới MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));


// Routes
app.use(cors());
app.use('/uploads/avatar', express.static(path.join(__dirname, 'uploads/avatar')));
app.use('/uploads/attendances', express.static(path.join(__dirname, 'uploads/attendances')));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/working-days', workingDayRoutes);
app.use('/api/roles', roleRoutes);

// Lắng nghe server
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});
