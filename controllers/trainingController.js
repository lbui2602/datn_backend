const faceapi = require('face-api.js');
const canvas = require('canvas');
const FaceModel = require('../models/FaceModel');
const User = require('../models/User');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { setFaceMatcher: setFaceMatcherFace } = require('./faceController');

let trainedData = [];
let faceMatcher;

const saveTrainingDataToDB = async (labeledFaceDescriptor) => {
    const { label, descriptors } = labeledFaceDescriptor;
    const descriptorsArray = descriptors.map((desc) => Array.from(desc));

    await FaceModel.findOneAndUpdate(
        { label },
        { label, descriptors: descriptorsArray },
        { upsert: true, new: true }
    );
};

const setFaceMatcher = (matcher) => {
    faceMatcher = matcher;
};

const loadTrainingDataForLabel = async (label, imageBuffer) => {
    const descriptors = [];

    try {
        const image = await canvas.loadImage(imageBuffer);
        const detection = await faceapi
            .detectSingleFace(image)
            .withFaceLandmarks()
            .withFaceDescriptor();
        if (detection) {
            descriptors.push(detection.descriptor);
        }
    } catch (error) {
        console.error(`Lỗi khi xử lý ảnh của ${label}:`, error);
    }

    return new faceapi.LabeledFaceDescriptors(label, descriptors);
};


const uploadFiles = async (req, res) => {
  try {
    const { name } = req.body;
    const file = req.file;

    if (!name || !file) {
      return res.json({code : "0",message:"Vui lòng tải file"});
    }

    const imageBuffer = file.buffer;
    const newTrainingData = await loadTrainingDataForLabel(name, imageBuffer);

    if (!newTrainingData.descriptors.length) {
      return res.json({code : "0",message:"Không phát hiện khuôn mặt'"});
    }

    await saveTrainingDataToDB(newTrainingData);

    trainedData.push(newTrainingData);
    faceMatcher = new faceapi.FaceMatcher(trainedData, 0.6);
    setFaceMatcherFace(faceMatcher);

    // ----- Thêm phần lưu file vào uploads/avatar/ -----
    const uploadsDir = path.join(__dirname, '../uploads/avatar');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, `${name}.jpg`);
    fs.writeFileSync(filePath, imageBuffer);

    const avatarPath = `/uploads/avatar/${name}.jpg`;

    // ----- Cập nhật đường dẫn avatar cho user có id = name -----
    const user = await User.findById(name);
    if (user) {
      user.image = avatarPath;
      await user.save();
    }

    res.json({code : "1",message:"'Upload, huấn luyện dữ liệu và lưu avatar thành công!'"});
  } catch (error) {
    console.error('Lỗi khi upload file:', error);
    return res.json({code : "0",message:error.error});
  }
};

const training = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.json({code : "0",message:"Vui lòng gửi tên"});
    }

    if (!req.file) {
      return res.json({ message: "Không có file ảnh được gửi", code: "0" });
    }

    const formData = new FormData();
    formData.append("image", req.file.buffer, {
      filename: "user.jpg",
      contentType: req.file.mimetype,
    });

    const response = await axios.post("http://0.0.0.0:5000/detect-face", formData, {
      headers: formData.getHeaders(),
    });

    const face_detected = response.data?.face_detected;

    if (!face_detected) {
      return res.json({
        message: "Không tìm thấy khuôn mặt trong ảnh.",
        code: "0"
      });
    }

    // ✅ Nếu phát hiện khuôn mặt, lưu ảnh và cập nhật user
    const imageBuffer = req.file.buffer;

    const uploadsDir = path.join(__dirname, '../uploads/avatar');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, `${name}.jpg`);
    fs.writeFileSync(filePath, imageBuffer);

    const avatarPath = `/uploads/avatar/${name}.jpg`;

    const user = await User.findById(name);
    
    if (user) {
      user.image = avatarPath;
      await user.save();
    }

    res.json({code : "1",message:"'Upload, huấn luyện dữ liệu và lưu avatar thành công!'"});

  } catch (error) {
    console.error("Chi tiết lỗi:", error.response?.data || error.message);
    res.json({ message: error.response?.data || error.message, code: "0" });
  }
};

module.exports = { uploadFiles, setFaceMatcher, loadTrainingDataForLabel, trainedData, training };
