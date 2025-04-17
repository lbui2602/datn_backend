const express = require('express');
const { uploadFiles } = require('../controllers/trainingController');
const upload = require('../middleware/baseMiddleware');

const router = express.Router();

router.post('/upload-file', upload.single('file'), uploadFiles);

module.exports = router;
