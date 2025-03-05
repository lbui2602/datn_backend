const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const { idUser } = req.body;
        const uploadDir = `uploads/attendances/${idUser}`;
        
        // Tạo thư mục nếu chưa có
        fs.mkdirSync(uploadDir, { recursive: true });

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const { idUser, time } = req.body;
        const date = getFormattedDate(); // Format ngày
        const filename = `${idUser}_${date}_${time}${path.extname(file.originalname)}`;
        
        cb(null, filename);
    }
});

const upload = multer({ storage });

module.exports = upload;
