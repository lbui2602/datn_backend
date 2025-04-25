const express = require('express');
const { uploadFiles,training } = require('../controllers/trainingController');
const upload = require('../middleware/baseMiddleware');

const router = express.Router();

router.post('/upload-file', upload.single('file'), uploadFiles);
router.post('/', upload.single('image'), training);

module.exports = router;
