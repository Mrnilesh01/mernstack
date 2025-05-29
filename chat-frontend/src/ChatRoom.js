import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const socket = io(backendURL);

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState('');
  const [message, setMessage] = useState('');
  const [typingUser, setTypingUser] = useState('');
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
      alert("User and a message or file is required.");
      return;
    }

    let base64File = "";
    let fileName = "";

    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        base64File = reader.result;
        fileName = file.name;

        await fetch(`${backendURL}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user, message, file: base64File, fileName }),
        });

        setMessage('');
        setFile(null);
      };
      reader.readAsDataURL(file);
    } else {
      await fetch(`${backendURL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, message }),
      });

      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    fetchMessages();

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (audioRef.current) {
        audioRef.current.play();
      }
    });

    socket.on("typing", (username) => {
      setTypingUser(username);
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      typingTimeout.current = setTimeout(() => setTypingUser(''), 2000);
    });

    return () => {
      socket.off("newMessage");
      socket.off("typing");
    };
  }, []);

  return (
    <div className="chat-container">
      <h2>Chat Room</h2>

      <ul>
        {messages.map((msg) => (
          <li key={msg._id}>
            <strong>{msg.user}:</strong> {msg.message}
            {msg.file && (
              <div>
                📎 <a href={msg.file} download={msg.fileName} target="_blank" rel="noreferrer">{msg.fileName}</a>
              </div>
            )}
            <div className="timestamp">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
          </li>
        ))}
      </ul>

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
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoom;
