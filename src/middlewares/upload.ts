import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, './');
  },
  filename: function (_req, file, cb) {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  },
});

export const upload = multer({
  storage: storage,
});
