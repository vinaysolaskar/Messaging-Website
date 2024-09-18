import React, { useState, useEffect } from 'react';
import socket from './socket';
import axios from 'axios'; // Import axios for making HTTP requests
axios.defaults.baseURL = 'http://localhost:3000'; // Ensure this is the correct port

function ChannelRight({ selectedUser, userData, room }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (room) {
      console.log('Joining room:', room);
      socket.emit('joinRoom', room);

      setMessages([]);

      socket.on('previousMessages', (previousMessages) => {
        console.log('Received previous messages:', previousMessages);
        setMessages(previousMessages.map(msg => ({
          ...msg,
          user: msg.user === userData?.username ? 'Me' : selectedUser?.name || 'User'
        })));
      });

      socket.on('messagesDeleted', () => {
        console.log('Messages deleted');
        setMessages([]);
      });

      return () => {
        console.log('Leaving room:', room);
        socket.emit('leaveRoom', room);
        socket.off('previousMessages');
        socket.off('messagesDeleted');
      };
    }
  }, [room, selectedUser, userData]);

  useEffect(() => {
    const handleMessage = (message) => {
      console.log('Received message on client:', message);
      console.log('Raw date:', message.createdAt);
  
      const dateToUse = message.createdAt || new Date().toISOString();;
      console.log('Date to use:', dateToUse);
      const receivedDate = new Date(dateToUse);
  
      console.log('Parsed date:', receivedDate);
      if (!isNaN(receivedDate.getTime())) {
        message.createdAt = receivedDate.toLocaleString();
      } else {
        console.error('Invalid Date:', dateToUse);
        message.createdAt = 'Date not available'; // Fallback display
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
  
    // Attach the event listener
    socket.on('message', handleMessage);
  
    // Ensure cleanup
    return () => {
      socket.off('message', handleMessage);
    };
  }, [room, userData, selectedUser, messages]); // Dependencies that affect the useEffect
    

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && room && userData) {
      const createdAt = new Date().toISOString();
      console.log('Sending message with date:', createdAt);
      const message = { user: userData.username, text: input, room, createdAt };
      console.log('Message:', message);
      socket.emit('sendMessage', message);
      setInput('');
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

  const handleDeleteMessages = async () => {
    try {
      await axios.delete('/api/messages', { data: { room } });
      console.log('Messages deletion request sent');
    } catch (error) {
      console.error('Error deleting messages:', error);
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
                {console.log('msg', msg)}
                 
                  <div className="username">{msg.user}</div>
                  <div className="message">{msg.text}</div>
                  <div className="timestamp">{new Date(msg.createdAt).toLocaleTimeString()}</div>
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
            <button className='delete-messages-button' onClick={handleDeleteMessages}>Delete Previous Chats</button>
          </div>
        </>
      ) : (
        <p>Select a user to start chatting</p>
      )}
    </div>
  );
}

export default ChannelRight;
