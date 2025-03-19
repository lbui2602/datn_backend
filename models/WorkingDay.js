const mongoose = require('mongoose');

const workingDaySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  attendances: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' }], 
  totalHours: { type: Number, default: 0 },
  status: { type: Number, default:0 }
});

const WorkingDay = mongoose.model('WorkingDay', workingDaySchema);
module.exports = WorkingDay;
