
const multer = require('multer');
const path = require('path');
const {v4:uuidv4}=require('uuid')


// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Specify the directory where uploaded files will be stored
    cb(null, './public/uploads');
  },
  filename: (req, file, cb) => {
    // Specify the filename for uploaded files
    const uniqueFileName=uuidv4()
    cb(null, uniqueFileName+ path.extname(file.originalname));
  }
});

module.exports= multer({ storage: storage });