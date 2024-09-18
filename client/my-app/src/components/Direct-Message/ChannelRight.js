import React, { useState, useEffect } from 'react';
import socket from '../socket';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa'; // Import Font Awesome Trash icon

axios.defaults.baseURL = 'http://localhost:3000';

function ChannelRight({ selectedUser, userData, room }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (room) {
      console.log('Joining room:', room);
      socket.emit('joinRoom', room);

      setMessages([]);

      socket.on('previousMessages', (previousMessages) => {
        setMessages(previousMessages.map(msg => ({
          ...msg,
          user: msg.user === userData?.username ? 'Me' : selectedUser?.name || 'User',
          createdAt: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      });

      socket.on('messagesDeleted', () => {
        console.log('Messages deleted');
        setMessages([]);
      });

      socket.on('messageDeleted', (messageId) => {
        setMessages((prevMessages) => 
          prevMessages.map(msg => 
            msg._id === messageId ? { ...msg, text: 'This message was deleted' } : msg
          ).filter(msg => msg._id !== messageId || msg.text === 'This message was deleted')
        );
      });

      return () => {
        console.log('Leaving room:', room);
        socket.emit('leaveRoom', room);
        socket.off('previousMessages');
        socket.off('messagesDeleted');
        socket.off('messageDeleted');
      };
    }
  }, [room, selectedUser, userData]);

  useEffect(() => {
    const handleMessage = (message) => {
      console.log('Received message on client:', message);
      console.log('Raw date:', message.createdAt);

      const dateToUse = message.createdAt || new Date().toISOString();
      const receivedDate = new Date(dateToUse);

      if (!isNaN(receivedDate.getTime())) {
        message.createdAt = receivedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        console.error('Invalid Date:', dateToUse);
        message.createdAt = 'Date not available';
      }

      if (message.room === room) {
        const isSender = message.user === userData?.username;
        const displayMessage = isSender 
          ? { ...message, user: 'Me' }
          : { ...message, user: selectedUser?.name || 'User' };

        setMessages((prevMessages) => [...prevMessages, displayMessage]);

        if (!isSender) notifyUser(displayMessage);
      }
    };

    socket.on('message', handleMessage);

    return () => {
      socket.off('message', handleMessage);
    };
  }, [room, userData, selectedUser]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && room && userData) {
      const createdAt = new Date().toISOString();
      const message = { user: userData.username, text: input, room, createdAt };
      socket.emit('sendMessage', message);
      setInput('');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`/messages/${messageId}`);
      socket.emit('messageDeleted', messageId); // Notify other clients
      setMessages((prevMessages) => 
        prevMessages.map(msg => 
          msg._id === messageId ? { ...msg, text: 'This message was deleted' } : msg
        ).filter(msg => msg._id !== messageId || msg.text === 'This message was deleted')
      );
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const notifyUser = (message) => {
    if (Notification.permission === 'granted') {
      new Notification('New Message', {
        body: `${message.user}: ${message.text}`,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('New Message', {
            body: `${message.user}: ${message.text}`,
          });
        }
      });
    }
  };

  return (
    <div className='AppChannelWrapperRight'>
      {selectedUser ? (
        <>
          <h2>Chat with {selectedUser.name}</h2>
          <div className='chatWindow'>
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={index} className={`message-item ${msg.user === 'Me' ? 'myMessage' : 'userMessage'}`}>
                  <div className="message-content">
                    <div className="username">{msg.user}</div>
                    <div className="message">{msg.text}</div>
                    <div className="timestamp">{msg.createdAt}</div>
                  </div>
                  {msg.user === 'Me' && msg.text !== 'This message was deleted' && (
                    <button className="delete-btn" onClick={() => handleDeleteMessage(msg._id)}>
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p>No messages yet</p>
            )}
            <div className='form-input'>
              <form onSubmit={handleSendMessage}>
                <input
                  type='text'
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='Type your message'
                />
                <button type='submit'>Send</button>
              </form>
            </div>
          </div>
        </>
      ) : (
        <p>Select a user to start chatting</p>
      )}
    </div>
  );
}

export default ChannelRight;
