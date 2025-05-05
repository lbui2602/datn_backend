const faceapi = require("face-api.js");
const canvas = require("canvas");
const Attendance = require("../models/Attendance");
const WorkingDay = require("../models/WorkingDay");
const FaceModel = require("../models/FaceModel");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const fsPromises = require("fs").promises;
const {
  calculateHours,
  adjustTime,
  compareTime,
} = require("../controllers/attendanceController");

let faceMatcher;

const setFaceMatcher = (matcher) => {
  faceMatcher = matcher;
};

// const verifyFace2 = async (req, res) => {
//   try {
//     const { userId, time, date } = req.body;

//     if (!req.file) {
//       return res
//         .status(400)
//         .json({ message: "Vui lòng tải ảnh lên!", code: "0" });
//     }

//     const userDescriptor = await FaceModel.findOne({ label: userId });

//     if (!userDescriptor) {
//       return res.json({
//         message: "Không tìm thấy descriptor khuôn mặt của người dùng!",
//         code: "0",
//       });
//     }

//     // 1. Quét khuôn mặt từ ảnh
//     const image = await canvas.loadImage(req.file.buffer);
//     const detections = await faceapi
//       .detectAllFaces(image)
//       .withFaceLandmarks()
//       .withFaceDescriptors();
//     // const detections = await faceapi.detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())

//     const descriptors = userDescriptor.descriptors.map(
//       (desc) => new Float32Array(desc)
//     );
//     const labeledDescriptor = new faceapi.LabeledFaceDescriptors(
//       userDescriptor.label,
//       descriptors
//     );

//     const faceMatcher = new faceapi.FaceMatcher(labeledDescriptor);

//     const matchedNames = detections.map(
//       (detection) => faceMatcher.findBestMatch(detection.descriptor).label
//     );
//     console.log(matchedNames)

//     if (!matchedNames.includes(userId)) {
//       return res.json({
//         message: "Xác thực khuôn mặt không trùng khớp!",
//         code: "0",
//       });
//     }

//     const timestamp = new Date().toISOString().replace(/[:.]/g, "-"); // Định dạng ngày giờ
//     const ext = path.extname(req.file.originalname); // lấy phần mở rộng file
//     const filename = `attendance_${timestamp}${ext}`;
//     const uploadPath = path.join(
//       __dirname,
//       "..",
//       "uploads",
//       "attendance",
//       filename
//     );

//     // Đảm bảo thư mục tồn tại
//     fs.mkdirSync(path.dirname(uploadPath), { recursive: true });

//     fs.writeFileSync(uploadPath, req.file.buffer);

//     const imagePath = `/uploads/attendance/${filename}`;

//     let workingDay = await WorkingDay.findOne({ userId, date }).populate(
//       "attendances"
//     );

//     if (!workingDay) {
//       workingDay = await WorkingDay.create({
//         userId,
//         date,
//         attendances: [],
//         totalHours: 0,
//         status: compareTime(time, "08:00") > 0 ? 0 : 1,
//       });
//     }

//     workingDay.totalHours = Number(workingDay.totalHours) || 0;

//     const lastAttendance =
//       workingDay.attendances.length > 0
//         ? await Attendance.findById(
//           workingDay.attendances[workingDay.attendances.length - 1]
//         )
//         : null;

//     let type = "check_in";
//     if (lastAttendance && lastAttendance.type === "check_in") {
//       type = "check_out";
//     }

//     const attendance = await Attendance.create({
//       userId,
//       date,
//       time,
//       type,
//       image: imagePath,
//     });

//     workingDay.attendances.push(attendance._id);

//     if (type === "check_out" && lastAttendance) {
//       const hoursWorked = calculateHours(
//         adjustTime(lastAttendance.time),
//         adjustTime(time)
//       );
//       if (!isNaN(hoursWorked) && hoursWorked > 0) {
//         workingDay.totalHours = Number(
//           (workingDay.totalHours + hoursWorked).toFixed(2)
//         );
//       }
//     }

//     await workingDay.save();

//     const updatedWorkingDay = await WorkingDay.findOne({ userId, date })
//       .populate("attendances")
//       .lean();

//     res.status(200).json({
//       message: "Xác thực thành công và đã điểm danh!",
//       code: "1",
//       attendance: attendance,
//       attendances: updatedWorkingDay.attendances,
//       totalHours: updatedWorkingDay.totalHours,
//     });
//   } catch (error) {
//     console.error("Lỗi server:", error);
//     res
//       .status(500)
//       .json({ message: "Lỗi server: " + error.message, code: "0" });
//   }
// };
const verifyFace = async (req, res) => {
  try {
    const { userId, time, date } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Vui lòng tải ảnh lên!", code: "0" });
    }

    // 1. Quét khuôn mặt từ ảnh
    console.time("loadImage");
    const image = await canvas.loadImage(req.file.buffer);
    console.timeEnd("loadImage");

    console.time("detectSingleFace");
    const detection = await faceapi
      .detectSingleFace(image)
      .withFaceLandmarks()
      .withFaceDescriptor();
    console.timeEnd("detectSingleFace");

    if (!detection) {
      return res.json({
        message: "Không tìm thấy khuôn mặt nào!",
        code: "0",
      });
    }

    console.time("findBestMatch");
    const bestMatch = faceMatcher.findBestMatch(detection.descriptor).label;
    console.timeEnd("findBestMatch");

    console.log("Best Match:", bestMatch);

    if (bestMatch !== userId) {
      return res.json({
        message: "Xác thực khuôn mặt không trùng khớp!",
        code: "0",
      });
    }

    // 3. Ghi file ảnh dùng fs.promises
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const ext = path.extname(req.file.originalname);
    const filename = `attendance_${timestamp}${ext}`;
    const uploadDir = path.join(__dirname, "..", "uploads", "attendance");
    const uploadPath = path.join(uploadDir, filename);
    const imagePath = "/uploads/attendance/" + filename;

    await fsPromises.mkdir(uploadDir, { recursive: true }); // tạo thư mục nếu chưa có
    await fsPromises.writeFile(uploadPath, req.file.buffer); // ghi file async

    // 4. Làm việc với DB: Promise.all
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

    // Tạo attendance + cập nhật workingDay.attendances song song
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

const compareFaces = async (req, res) => {
  try {
    const { fileName, userId, time, date } = req.body;
    console.log("fileName:", fileName);

    if (!req.file) {
      return res.json({ message: "Không có file ảnh được gửi", code: "0" });
    }

    if (!fileName || !userId || !time || !date) {
      return res.json({ message: "Thiếu tham số trong request", code: "0" });
    }

    // Bỏ dấu "/" ở đầu nếu có
    const relativePath = fileName.startsWith("/")
      ? fileName.slice(1)
      : fileName;
    const serverImagePath = path.join(__dirname, "..", relativePath);

    console.log(serverImagePath);

    // Gửi dữ liệu sang Flask
    const formData = new FormData();
    formData.append("image1", req.file.buffer, {
      filename: "user.jpg",
      contentType: req.file.mimetype,
    });
    formData.append("image2", fs.createReadStream(serverImagePath));

    const response = await axios.post(
      "http://0.0.0.0:5000/compare-faces",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    const matched = response.data?.matched;

    if (!matched) {
      return res.json({
        message: "Xác thực khuôn mặt không trùng khớp!",
        code: "0",
      });
    }

    // Nếu matched === true => tiếp tục ghi attendance
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const ext = path.extname(req.file.originalname);
    const filename = `attendance_${timestamp}${ext}`;
    const uploadDir = path.join(__dirname, "..", "uploads", "attendance");
    const uploadPath = path.join(uploadDir, filename);
    const imagePath = "/uploads/attendance/" + filename;

    await fsPromises.mkdir(uploadDir, { recursive: true });
    await fsPromises.writeFile(uploadPath, req.file.buffer);

    // Tìm hoặc tạo mới WorkingDay
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

    res.json({
      message: "Xác thực thành công và đã điểm danh!",
      code: "1",
      attendance: attendance,
      attendances: updatedWorkingDay.attendances.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      totalHours: updatedWorkingDay.totalHours,
    });
  } catch (error) {
    let errorMessage = "";

    if (
      typeof error.response?.data === "object" &&
      error.response?.data?.error
    ) {
      // Nếu data là object và có field 'error'
      errorMessage = error.response.data.error;
    } else {
      // Nếu không thì lấy toString hoặc message
      errorMessage = error.response?.data?.toString() || error.message;
    }

    res.json({ message: errorMessage, code: "0" });
  }
};

module.exports = { verifyFace, setFaceMatcher, compareFaces };
