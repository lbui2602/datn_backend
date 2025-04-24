const Attendance = require('../models/Attendance');
const WorkingDay = require('../models/WorkingDay');
const User = require('../models/User');
const path = require('path');

// Ghi nhận chấm công
const recordAttendance = async (req, res) => {
  try {
    const { userId, time, date } = req.body;

    if (!req.file) {
      return res.json({ message: "Vui lòng tải ảnh lên!", code: '0' });
    }

    const imagePath = `/uploads/attendance/${req.file.filename}`;

    // Tìm ngày làm việc hiện tại của user
    let workingDay = await WorkingDay.findOne({ userId, date }).populate('attendances');

    if (!workingDay) {
      if(compareTime(time,"08:00") > 0){
        workingDay = await WorkingDay.create({ userId, date, attendances: [], totalHours: 0,status: 0});
      }else{
        workingDay = await WorkingDay.create({ userId, date, attendances: [], totalHours: 0,status :1});
      }
      
    }

    workingDay.totalHours = Number(workingDay.totalHours) || 0; // Ép kiểu đảm bảo luôn là số

    // Kiểm tra lần chấm công trước đó
    const lastAttendance = workingDay.attendances.length > 0
      ? await Attendance.findById(workingDay.attendances[workingDay.attendances.length - 1])
      : null;

    let type = 'check_in';
    if (lastAttendance && lastAttendance.type === 'check_in') {
      type = 'check_out';
    }
    // Tạo bản ghi chấm công mới
    const attendance = await Attendance.create({ userId, date, time, type, image: imagePath });

    // Lưu vào danh sách chấm công
    workingDay.attendances.push(attendance._id);

    // Tính tổng số giờ làm
    if (type === 'check_out' && lastAttendance) {
      const hoursWorked = calculateHours(adjustTime(lastAttendance.time), adjustTime(time));
      if (!isNaN(hoursWorked) && hoursWorked > 0) {
        workingDay.totalHours = Number((workingDay.totalHours + hoursWorked).toFixed(2));
      }
    }

    await workingDay.save();

    // Lấy lại danh sách attendances theo ngày
    const updatedWorkingDay = await WorkingDay.findOne({ userId, date })
      .populate('attendances')
      .lean();

    res.json({
      message: "Điểm danh thành công!",
      code: '1',
      attendance: attendance,
      attendances: updatedWorkingDay.attendances,
      totalHours: updatedWorkingDay.totalHours
    });

  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ message: "Server error: " + error.message, code: '0' });
  }
};
function compareTime(time1, time2) {
  const [h1, m1] = time1.split(":").map(Number);
  const [h2, m2] = time2.split(":").map(Number);
  return (h1 * 60 + m1) - (h2 * 60 + m2);
}
function adjustTime(inputTime) {
  const [hours, minutes] = inputTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;

  const startOfWork = 8 * 60;  // 8:00 -> 480 phút
  const endOfWork = 17 * 60;   // 17:00 -> 1020 phút

  if (totalMinutes < startOfWork) {
      return "08:00";
  } else if (totalMinutes > endOfWork) {
      return "17:00";
  } else {
      return inputTime; // Giữ nguyên nếu trong khoảng 8:00 - 17:00
  }
}

// Lấy danh sách chấm công theo user
const getAttendanceByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const attendances = await Attendance.find({ userId }).sort({ date: -1 });

    res.json({ code: '1', attendances });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ message: "Server error: " + error.message, code: '0' });
  }
};

// Hàm tính số giờ làm
function calculateHours(startTime, endTime) {
  const toMinutes = (time) => {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return NaN; // Kiểm tra định dạng hh:mm
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  if (isNaN(startMinutes) || isNaN(endMinutes) || endMinutes <= startMinutes) {
    return 0; // Trả về 0 nếu giá trị không hợp lệ
  }

  return Number(((endMinutes - startMinutes) / 60).toFixed(2)); // Ép kiểu về số
}

// Lấy chấm công theo user và ngày
const getAttendanceByUserIdAndDate = async (req, res) => {
  try {
    const { userId, date } = req.body;
    let workingDay = await WorkingDay.findOne({ userId, date }).populate('attendances');

    if (!workingDay) {
      return res.json({ message: "Không có dữ liệu chấm công cho ngày này!", code: '0' });
    }
    res.json({
      code: '1',
      attendances: workingDay.attendances,
      totalHours: Number(workingDay.totalHours) || 0
    });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ message: "Server error: " + error.message, code: '0' });
  }
};
const getAllAttendance = async (req, res) => {
  try {
    const { date, name, idDepartment } = req.body;

    // Tạo bộ lọc cho user
    let userFilter = {};

    // Ưu tiên lọc theo idDepartment trước
    if (idDepartment && idDepartment.trim() !== "") {
      userFilter.idDepartment = idDepartment.trim();
    }

    // Nếu có name, thêm điều kiện tìm name
    if (name && name.trim() !== "") {
      userFilter.fullName_no_accent = { $regex: new RegExp(name.trim(), 'i') };
    }

    // Lấy danh sách userId phù hợp
    const users = await User.find(userFilter).select('_id');
    const userIds = users.map(user => user._id);

    // Nếu không có user phù hợp, trả về rỗng
    if (userIds.length === 0) {
      return res.json({
        code: '1',
        attendances: []
      });
    }

    // Tạo bộ lọc cho attendance
    let attendanceFilter = {
      userId: { $in: userIds }
    };

    if (date && date.trim() !== "") {
      attendanceFilter.date = date.trim();
    }

    // Lấy danh sách attendance
    const attendances = await Attendance.find(attendanceFilter)
      .populate({
        path: 'userId',
        select: 'fullName fullName_no_accent idDepartment'
      })
      .sort({ date: -1, time: -1 })
      .lean();

    res.json({
      code: '1',
      attendances: attendances
    });

  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ message: "Server error: " + error.message, code: '0' });
  }
};



module.exports = { recordAttendance,
   getAttendanceByUser,
   getAttendanceByUserIdAndDate,
   calculateHours,
   adjustTime,
   compareTime,
   getAllAttendance 
  };
