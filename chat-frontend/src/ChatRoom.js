// ChatRoom.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const socket = io(backendURL);

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState('');
  const [message, setMessage] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);
  const typingTimeout = useRef(null);
  const audioRef = useRef(new Audio('/notification.mp3'));

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${backendURL}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

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
    }
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  useEffect(() => {
    fetchMessages();

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (audioRef.current) audioRef.current.play();
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

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="chat-container">
      <h2>Dalvik Chat Messenger</h2>
      <ul>
        {messages.map((msg, index) => (
          <li key={msg._id || index}>
            <strong>{msg.user}:</strong> {msg.message}
            {msg.file && (
              <div>
                <a href={msg.file} download={msg.fileName} target="_blank" rel="noopener noreferrer">
                  📎 {msg.fileName}
                </a>
              </div>
            )}
            <div style={{ fontSize: "0.8em", color: "gray" }}>
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
          </li>
        ))}
      </ul>

      {typingUser && <p><em>{typingUser} is typing...</em></p>}

      <div className="input-row">
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
    </div>
  );
};

export default ChatRoom;
