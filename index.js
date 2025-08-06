const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // ✅ UNTUK NAMA RANDOM

const app = express();
const PORT = 3000;

// Set path ffmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);

// Middleware: serve folder public sebagai frontend
app.use(express.static('public'));

// Multer setup
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Hanya file .mp4 yang diperbolehkan.'));
    }
  }
});

// Endpoint POST untuk convert video ke mp3
app.post('/convert', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('❌ File tidak ditemukan.');
  }

  const inputPath = req.file.path;
  const randomName = 'mp3_' + crypto.randomBytes(4).toString('hex') + '.mp3';
  const outputPath = path.join(__dirname, 'uploads', randomName);

  console.log('🚀 Uploaded:', req.file.originalname);

  ffmpeg(inputPath)
    .toFormat('mp3')
    .audioBitrate('192k')
    .on('start', (cmd) => console.log('FFmpeg command:', cmd))
    .on('end', () => {
      console.log('✅ Conversion done:', outputPath);

      // Kirim hasil MP3 sebagai file download (via blob)
      res.download(outputPath, randomName, (err) => {
        if (err) {
          console.error('❌ Error saat download:', err.message);
        }
        // Hapus file sementara
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', (err) => {
      console.error('❌ Conversion failed:', err.message);
      fs.unlinkSync(inputPath); // Hapus file upload jika gagal
      res.status(500).send('Conversion failed: ' + err.message);
    })
    .save(outputPath);
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`✅ Server jalan di http://localhost:${PORT}`);
});
