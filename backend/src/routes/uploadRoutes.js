import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    console.error('Error creating uploads directory:', e);
  }
}

// Memory storage buffers file in RAM, avoiding multer stream-level EPERM on macOS
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

const router = express.Router();

router.post('/', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Upload Error (Multer):', err);
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'File upload failed' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file received in request.' });
    }

    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const originalName = req.file.originalname || 'document.pdf';
      const safeExt = path.extname(originalName) || '';
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `${uniqueSuffix}${safeExt}`;
      const targetPath = path.join(uploadDir, filename);

      // Write file buffer to disk
      fs.writeFileSync(targetPath, req.file.buffer);

      const fileUrl = `/uploads/${filename}`;
      const mimeType = req.file.mimetype || '';
      const lowerName = originalName.toLowerCase();
      let type = 'document';

      if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(lowerName)) {
        type = 'image';
      } else if (mimeType.startsWith('video/') || /\.(mp4|webm|mkv|mov|avi|flv)$/i.test(lowerName)) {
        type = 'video';
      } else if (mimeType.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|aac|flac|opus)$/i.test(lowerName)) {
        type = 'audio';
      } else if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
        type = 'pdf';
      }

      console.log(`✅ File uploaded successfully: ${filename} (${req.file.size} bytes)`);

      return res.json({
        success: true,
        fileUrl,
        type,
        fileName: originalName,
        size: req.file.size
      });
    } catch (writeErr) {
      console.error('File write error to uploads:', writeErr);
      return res.status(500).json({
        success: false,
        message: `Failed to write file to disk: ${writeErr.message}`
      });
    }
  });
});

export default router;
