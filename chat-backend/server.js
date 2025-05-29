require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const ChatMessage = require("./models/ChatMessage");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ FIXED: using process.env.MONGO_URL
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

app.get("/messages", async (req, res) => {
  try {
    const messages = await ChatMessage.find();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/messages", async (req, res) => {
  try {
    const { user, message } = req.body;
    if (!user || !message) {
      return res.status(400).json({ error: "User and message are required" });
    }

    const chatMessage = new ChatMessage({ user, message });
    await chatMessage.save();
    io.emit("newMessage", chatMessage);
    res.status(201).json(chatMessage);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

io.on("connection", (socket) => {
  console.log("🔌 A user connected");

  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("disconnect", () => {
    console.log("🔌 A user disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
