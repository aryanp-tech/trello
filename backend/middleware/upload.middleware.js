const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, extension)
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();

    callback(null, `${Date.now()}-${baseName || 'attachment'}${extension}`);
  },
});

const fileFilter = (_req, _file, callback) => {
  // Allow all file types (images, pdfs, code, archives, docs, etc.)
  callback(null, true);
};

const uploadCardFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
});

module.exports = {
  uploadCardFile,
};
