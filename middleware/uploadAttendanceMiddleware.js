const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const { userId } = req.body;
        const uploadDir = `uploads/attendances/${userId}`;
        
        // Tạo thư mục nếu chưa có
        fs.mkdirSync(uploadDir, { recursive: true });

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const { userId, time, date } = req.body;
        const filename = `${userId}_${date}_${time}${path.extname(file.originalname)}`;
        cb(null, filename);
    }
});

const upload = multer({ storage });

module.exports = upload;
