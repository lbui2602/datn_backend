const faceapi = require("face-api.js");
const canvas = require("canvas");
const Attendance = require("../models/Attendance");
const WorkingDay = require("../models/WorkingDay");
const FaceModel = require("../models/FaceModel");
const path = require("path");
const fs = require("fs");
const {
  calculateHours,
  adjustTime,
  compareTime,
} = require("../controllers/attendanceController");

let faceMatcher;

const setFaceMatcher = (matcher) => {
  faceMatcher = matcher;
};

const verifyFace = async (req, res) => {
  try {
    const { userId, time, date } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Vui lòng tải ảnh lên!", code: "0" });
    }

    const userDescriptor = await FaceModel.findOne({ label: userId });

    if (!userDescriptor) {
      return res.json({
        message: "Không tìm thấy descriptor khuôn mặt của người dùng!",
        code: "0",
      });
    }

    // 1. Quét khuôn mặt từ ảnh
    const image = await canvas.loadImage(req.file.buffer);
    const detections = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceDescriptors();
      // const detections = await faceapi.detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())

    const descriptors = userDescriptor.descriptors.map(
      (desc) => new Float32Array(desc)
    );
    const labeledDescriptor = new faceapi.LabeledFaceDescriptors(
      userDescriptor.label,
      descriptors
    );

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptor);

    const matchedNames = detections.map(
      (detection) => faceMatcher.findBestMatch(detection.descriptor).label
    );

    if (!matchedNames.includes(userId)) {
      return res.json({
        message: "Xác thực khuôn mặt không trùng khớp!",
        code: "0",
      });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-"); // Định dạng ngày giờ
    const ext = path.extname(req.file.originalname); // lấy phần mở rộng file
    const filename = `attendance_${timestamp}${ext}`;
    const uploadPath = path.join(
      __dirname,
      "..",
      "uploads",
      "attendance",
      filename
    );

    // Đảm bảo thư mục tồn tại
    fs.mkdirSync(path.dirname(uploadPath), { recursive: true });

    fs.writeFileSync(uploadPath, req.file.buffer);

    const imagePath = `/uploads/attendance/${filename}`;

    let workingDay = await WorkingDay.findOne({ userId, date }).populate(
      "attendances"
    );

    if (!workingDay) {
      workingDay = await WorkingDay.create({
        userId,
        date,
        attendances: [],
        totalHours: 0,
        status: compareTime(time, "08:00") > 0 ? 0 : 1,
      });
    }

    workingDay.totalHours = Number(workingDay.totalHours) || 0;

    const lastAttendance =
      workingDay.attendances.length > 0
        ? await Attendance.findById(
            workingDay.attendances[workingDay.attendances.length - 1]
          )
        : null;

    let type = "check_in";
    if (lastAttendance && lastAttendance.type === "check_in") {
      type = "check_out";
    }

    const attendance = await Attendance.create({
      userId,
      date,
      time,
      type,
      image: imagePath,
    });

    workingDay.attendances.push(attendance._id);

    if (type === "check_out" && lastAttendance) {
      const hoursWorked = calculateHours(
        adjustTime(lastAttendance.time),
        adjustTime(time)
      );
      if (!isNaN(hoursWorked) && hoursWorked > 0) {
        workingDay.totalHours = Number(
          (workingDay.totalHours + hoursWorked).toFixed(2)
        );
      }
    }

    await workingDay.save();

    const updatedWorkingDay = await WorkingDay.findOne({ userId, date })
      .populate("attendances")
      .lean();

    res.status(200).json({
      message: "Xác thực thành công và đã điểm danh!",
      code: "1",
      attendance: attendance,
      attendances: updatedWorkingDay.attendances,
      totalHours: updatedWorkingDay.totalHours,
    });
  } catch (error) {
    console.error("Lỗi server:", error);
    res
      .status(500)
      .json({ message: "Lỗi server: " + error.message, code: "0" });
  }
};
//   const verifyFace2 = async (req, res) => {
//     try {
//       const { userId, time, date } = req.body;

//       if (!req.file) {
//         return res.status(400).json({ message: "Vui lòng tải ảnh lên!", code: '0' });
//       }

//       // 1. Quét khuôn mặt từ ảnh
//       const image = await canvas.loadImage(req.file.buffer);
//       const detections = await faceapi
//         .detectAllFaces(image)
//         .withFaceLandmarks()
//         .withFaceDescriptors();

//       if (!detections.length) {
//         return res.json({ message: "Không tìm thấy khuôn mặt nào!", code: '0' });
//       }

//       // 2. So khớp khuôn mặt
//       const matchedNames = detections.map(detection =>
//         faceMatcher.findBestMatch(detection.descriptor).label
//       );

//       if (!matchedNames.includes(userId)) {
//         return res.json({ message: "Xác thực khuôn mặt không trùng khớp!", code: '0' });
//       }

//       const timestamp2 = Date.now();
//       const ext2 = path.extname(req.file.originalname);
//       const filename2 = attendance_${timestamp2}${ext2};
//       const uploadPath = path.join(__dirname, '..', 'uploads', 'attendance', filename);

//       // Đảm bảo thư mục tồn tại
//       fs.mkdirSync(path.dirname(uploadPath), { recursive: true });

//       fs.writeFileSync(uploadPath, req.file.buffer);

//       const imagePath = /uploads/attendance/${filename};

//       let workingDay = await WorkingDay.findOne({ userId, date }).populate('attendances');

//       if (!workingDay) {
//         workingDay = await WorkingDay.create({
//           userId,
//           date,
//           attendances: [],
//           totalHours: 0,
//           status: compareTime(time, "08:00") > 0 ? 0 : 1
//         });
//       }

//       workingDay.totalHours = Number(workingDay.totalHours) || 0;

//       const lastAttendance = workingDay.attendances.length > 0
//         ? await Attendance.findById(workingDay.attendances[workingDay.attendances.length - 1])
//         : null;

//       let type = 'check_in';
//       if (lastAttendance && lastAttendance.type === 'check_in') {
//         type = 'check_out';
//       }

//       const attendance = await Attendance.create({
//         userId,
//         date,
//         time,
//         type,
//         image: imagePath
//       });

//       workingDay.attendances.push(attendance._id);

//       if (type === 'check_out' && lastAttendance) {
//         const hoursWorked = calculateHours(adjustTime(lastAttendance.time), adjustTime(time));
//         if (!isNaN(hoursWorked) && hoursWorked > 0) {
//           workingDay.totalHours = Number((workingDay.totalHours + hoursWorked).toFixed(2));
//         }
//       }

//       await workingDay.save();

//       const updatedWorkingDay = await WorkingDay.findOne({ userId, date })
//         .populate('attendances')
//         .lean();

//       res.status(200).json({
//         message: "Xác thực thành công và đã điểm danh!",
//         code: '1',
//         attendance: attendance,
//         attendances: updatedWorkingDay.attendances,
//         totalHours: updatedWorkingDay.totalHours
//       });

//     } catch (error) {
//       console.error("Lỗi server:", error);
//       res.status(500).json({ message: "Lỗi server: " + error.message, code: '0' });
//     }
//   };

module.exports = { verifyFace, setFaceMatcher };
