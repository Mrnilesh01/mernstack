import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const socket = io(backendURL);

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState('');
  const [message, setMessage] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const typingTimeout = useRef(null);
  const audioRef = useRef(new Audio('/notification.mp3'));
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${backendURL}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const sendMessage = async () => {
    if (!user.trim() || (!message.trim() && !file)) {
      alert("Please enter a message or attach a file.");
      return;
    }

    const payload = {
      user,
      message,
      file: file ? await toBase64(file) : null,
      fileName: file?.name || '',
    };

    try {
      await fetch(`${backendURL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setMessage('');
      setFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    fetchMessages();

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
      audioRef.current?.play();
      toast.info(`New message from ${msg.user}`);
    });

    socket.on("typing", (username) => {
      setTypingUser(username);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(''), 2000);
    });

    return () => {
      socket.off("newMessage");
      socket.off("typing");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  return (
    <div className="chat-container">
      <div className="header">
        <h2>Dalvik Chat Messenger</h2>
        <button onClick={() => setDarkMode((prev) => !prev)}>
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      {loading ? <p>Loading chat...</p> : (
        <ul>
          {messages.map((msg, index) => (
            <li key={msg._id || index} className={msg.user === user ? 'self' : ''}>
              <div className="avatar">{msg.user[0].toUpperCase()}</div>
              <div>
                <strong>{msg.user}:</strong> {msg.message}
                {msg.file && (
                  <div>
                    <a title={msg.fileName} href={msg.file} download={msg.fileName} target="_blank" rel="noopener noreferrer">
                      📎 {msg.fileName}
                    </a>
                  </div>
                )}
                <div className="timestamp">{new Date(msg.createdAt).toLocaleTimeString()}</div>
              </div>
            </li>
          ))}
          <div ref={messagesEndRef}></div>
        </ul>
      )}

      {typingUser && <p><em>{typingUser} is typing...</em></p>}

      <div className="input-area">
        <input
          type="text"
          placeholder="Your name"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            socket.emit("typing", user);
          }}
          onKeyDown={handleKeyPress}
        />
        <button onClick={() => setShowEmojiPicker((prev) => !prev)}>😊</button>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={sendMessage}>Send</button>
      </div>

      {showEmojiPicker && (
        <div className="emoji-picker">
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}

      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      <ToastContainer position="top-right" />
    </div>
  );
};

export default ChatRoom;
