const Attendance = require('../models/Attendance');
const WorkingDay = require('../models/WorkingDay');

// Ghi nhận chấm công
const recordAttendance = async (req, res) => {
  try {
    const { idUser, time, image } = req.body;
    const date = getFormattedDate()

    // Tìm ngày làm việc hiện tại của user
    let workingDay = await WorkingDay.findOne({ idUser, date }).populate('attendances');

    if (!workingDay) {
      workingDay = await WorkingDay.create({ idUser, date, attendances: [], totalHours: 0 });
    }

    // Đảm bảo totalHours có giá trị hợp lệ
    workingDay.totalHours = workingDay.totalHours || 0;

    // Kiểm tra lần chấm công trước đó (lần gần nhất)
    const lastAttendance = workingDay.attendances.length > 0 
      ? await Attendance.findById(workingDay.attendances[workingDay.attendances.length - 1]) 
      : null;

    let type = 'check_in';
    if (lastAttendance && lastAttendance.type === 'check_in') {
      type = 'check_out';
    }

    // Tạo bản ghi chấm công mới
    const attendance = await Attendance.create({ idUser, date, time, type, image });

    // Lưu vào danh sách chấm công của ngày đó
    workingDay.attendances.push(attendance._id);

    // Nếu đã có ít nhất một cặp check_in - check_out, tính tổng số giờ làm
    if (type === 'check_out' && lastAttendance) {
      const hoursWorked = calculateHours(lastAttendance.time,time)

      if (!isNaN(hoursWorked) && hoursWorked > 0) {
        workingDay.totalHours += hoursWorked;
      }
    }

    await workingDay.save();
    res.status(201).json({ message: "Attendance recorded successfully", attendance, workingDay });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy danh sách chấm công theo user
const getAttendanceByUser = async (req, res) => {
  try {
    const { idUser } = req.params;
    const attendances = await Attendance.find({ idUser }).sort({ date: -1 });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
function calculateHours(startTime, endTime) {
  const toMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
  };

  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  const difference = (endMinutes-startMinutes) / 60;
  return difference;
}
const getFormattedDate = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0'); // Lấy ngày và đảm bảo 2 chữ số
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Lấy tháng (0-based) và đảm bảo 2 chữ số
  const year = date.getFullYear(); // Lấy năm

  return `${day}-${month}-${year}`;
};

module.exports = { recordAttendance, getAttendanceByUser };
