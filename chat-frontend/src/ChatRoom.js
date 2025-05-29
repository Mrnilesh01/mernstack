// ===== FRONTEND: ChatRoom.js =====
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const socket = io(backendURL);

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState('');
  const [message, setMessage] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const typingTimeout = useRef(null);

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
    if (!user.trim() || !message.trim()) {
      alert("Both user and message are required.");
      return;
    }

    try {
      await fetch(`${backendURL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, message }),
      });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
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
      <h2>Dalvik Chat Messenger</h2>
      <ul>
        {messages.map((msg) => (
          <li key={msg._id}>
            <strong>{msg.user}:</strong> {msg.message}
            <div style={{ fontSize: "0.8em", color: "gray" }}>
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
          </li>
        ))}
      </ul>

      {typingUser && <p><em>{typingUser} is typing...</em></p>}

      <div>
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
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoom;
