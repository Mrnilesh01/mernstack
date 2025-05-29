import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const chatEndRef = useRef(null);

  const fetchMessages = async () => {
    const response = await axios.get('https://mernstack-chat-backend.onrender.com/messages');
    setMessages(response.data);
    scrollToBottom();
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playNotification = () => {
    const audio = new Audio('https://www.myinstants.com/media/sounds/notification.mp3');
    audio.play();
  };

  const sendMessage = async () => {
    if (!name || (!message && !file)) return;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('message', message);
    if (file) formData.append('file', file);

    await axios.post('https://mernstack-chat-backend.onrender.com/messages', formData);
    setMessage('');
    setFile(null);
    fetchMessages();
    playNotification();
  };

  return (
    <div className="App">
      <h2>Chat Room</h2>
      <div className="chat-container">
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>
              <strong>{msg.name}</strong>: {msg.message}
              <br />
              {msg.fileUrl && (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                  Download File
                </a>
              )}
              <div className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </li>
          ))}
          <div ref={chatEndRef}></div>
        </ul>
      </div>
      <div className="input-area">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <input
          type="file"
          onChange={e => setFile(e.target.files[0])}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoom;
