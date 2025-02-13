const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  type: { type: String, enum: ['check_in', 'check_out'], required: true },
  image: { type: String }
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
