const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục nếu chưa có
const uploadDir = path.join(__dirname, '../uploads/avatar/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Thư mục lưu avatar
    },
    filename: function (req, file, cb) {
        const { userId } = req.body;
        const filename = `${userId}${path.extname(file.originalname)}`;
        cb(null, filename);
    }
});


const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ hỗ trợ file ảnh!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;
