const express = require('express');
const mongoose = require('mongoose');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const workingDayRoutes = require('./routes/workingDayRoutes');
const roleRoutes = require('./routes/roleRoutes');
const mailRoutes = require('./routes/mailRoutes');

// Routes face
const faceRoutes = require('./routes/faceRoutes');
const trainingRoutes = require('./routes/trainingRoutes');

// Models face
const FaceModel = require('./models/FaceModel');

// Controllers face
const { setFaceMatcher: setFaceMatcherFace } = require('./controllers/faceController');
const { setFaceMatcher: setFaceMatcherTraining, trainedData } = require('./controllers/trainingController');


const http = require("http");

const groupRoutes = require("./routes/groupRoutes");
const messageRoutes = require("./routes/messageRoutes");
const socketIo = require("socket.io");

const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();


const app = express();
const port = 3000;

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

// Kết nối tới MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
// Cấu hình Canvas cho FaceAPI
faceapi.env.monkeyPatch({ Canvas: canvas.Canvas, Image: canvas.Image, ImageData: canvas.ImageData });

// Đường dẫn mô hình và dữ liệu
const modelsPath = path.join(__dirname, 'models');

// Hàm tải dữ liệu huấn luyện từ MongoDB
const loadTrainingDataFromDB = async () => {
    try {
        const faces = await FaceModel.find();
        return faces.map((face) => {
            const descriptors = face.descriptors.map((desc) => new Float32Array(desc));
            return new faceapi.LabeledFaceDescriptors(face.label, descriptors);
        });
    } catch (err) {
      
        return [];
    }
};

// Hàm tải các mô hình nhận diện
async function initModels() {
    try {
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
      
    } catch (err) {
       
    }
}

// Hàm khởi tạo ứng dụng
async function init() {
    await initModels();

    // Lấy dữ liệu từ MongoDB
    const faceDescriptorsFromDB = await loadTrainingDataFromDB();

    if (faceDescriptorsFromDB.length === 0) {
    }

    // Gán dữ liệu đã huấn luyện
    trainedData.splice(0, trainedData.length, ...faceDescriptorsFromDB);

    // Tạo FaceMatcher nếu có dữ liệu
    if (trainedData.length > 0) {
        const faceMatcher = new faceapi.FaceMatcher(trainedData, 0.5);
        setFaceMatcherFace(faceMatcher);
        setFaceMatcherTraining(faceMatcher);
    } else {
    }
}

// Khởi chạy ứng dụng
init();

// Routes
app.use(cors());
app.use('/uploads/avatar', express.static(path.join(__dirname, 'uploads/avatar')));
app.use('/uploads/attendance', express.static(path.join(__dirname, 'uploads/attendance')));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/working-days', workingDayRoutes);
app.use('/api/roles', roleRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/messages", messageRoutes);
app.use('/api/mail', mailRoutes);
require("./socket/socketHandler")(io);

// Routes face
app.use('/api/face', faceRoutes);
app.use('/api/training', trainingRoutes);
// Lắng nghe server
server.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});
