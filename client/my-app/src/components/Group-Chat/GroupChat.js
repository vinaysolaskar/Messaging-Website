import React, { useState, useEffect } from 'react';
import socket from '../socket';
import axios from 'axios';

function GroupChat({ group, userData }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.emit('joinGroup', group.id);

    socket.on('previousGroupMessages', (previousMessages) => {
      setMessages(previousMessages);
    });

    socket.on('groupMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.emit('leaveGroup', group.id);
      socket.off('previousGroupMessages');
      socket.off('groupMessage');
    };
  }, [group]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const message = { user: userData.username, text: input, groupId: group.id };
      socket.emit('sendGroupMessage', message);
      setInput('');
    }
  };

  return (
    <div>
      <h3>{group.name}</h3>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.user}: </strong>{msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default GroupChat;
