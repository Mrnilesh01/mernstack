// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const messages = [];

// Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.get('/messages', (req, res) => res.json(messages));

app.post('/messages', upload.single('file'), (req, res) => {
  const { name, message } = req.body;
  const fileUrl = req.file ? `https://mernstack-chat-backend.onrender.com/uploads/${req.file.filename}` : null;

  const newMessage = {
    name,
    message,
    timestamp: new Date(),
    fileUrl
  };
  messages.push(newMessage);
  res.status(201).json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
