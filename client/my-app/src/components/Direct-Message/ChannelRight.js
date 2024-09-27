import React, { useState, useEffect } from 'react';
import socket from '../socket';
import '../../App.css';

function ChannelRight({ selectedUser, selectedGroup, userData }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    let roomId;

    if (selectedUser) {
      roomId = getRoomId(userData.email, selectedUser.email);
      socket.emit('joinRoom', roomId); 

      socket.on('previousMessages', (previousMessages) => {
        setMessages(previousMessages);
      });

      socket.on('message', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      socket.on('messageDeleted', (deletionNotice) => {
        setMessages((prev) => {
          const index = prev.findIndex(msg => msg._id === deletionNotice.deletedMessageId);
          if (index !== -1) {
            const deleteMessage = {
              _id: deletionNotice.deletedMessageId,
              user: deletionNotice.user,
              text: deletionNotice.text,
              createdAt: deletionNotice.createdAt,
              isDeleted: true,
              groupId: deletionNotice.groupId,
              room: deletionNotice.room,
              email: deletionNotice.email,
            };
            const updatedMessages = [...prev];
            updatedMessages[index] = deleteMessage;
            return updatedMessages;
          }
          return prev; 
        });
      });

      return () => {
        socket.emit('leaveRoom', roomId);
        socket.off('previousMessages');
        socket.off('message');
        socket.off('messageDeleted');
      };
    } else if (selectedGroup) {
      roomId = selectedGroup.id;
      socket.emit('joinGroup', roomId); 

      socket.on('previousGroupMessages', (previousMessages) => {
        setMessages(previousMessages);
      });

      socket.on('groupMessage', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      socket.on('messageDeleted', (deletionNotice) => {
        setMessages((prev) => {
          const index = prev.findIndex(msg => msg._id === deletionNotice.deletedMessageId);
          if (index !== -1) {
            const deleteMessage = {
              _id: deletionNotice.deletedMessageId,
              user: deletionNotice.user,
              text: deletionNotice.text,
              isDeleted: true,
              groupId: deletionNotice.groupId,
              room: deletionNotice.room,
              email: deletionNotice.email,
              createdAt: deletionNotice.createdAt              
            };
            const updatedMessages = [...prev];
            updatedMessages[index] = deleteMessage;
            return updatedMessages;
          }
          console.warn('Message not found for deletion:', deletionNotice.deletedMessageId);
          return prev;
        });
      });

      return () => {
        socket.emit('leaveGroup', roomId);
        socket.off('previousGroupMessages');
        socket.off('groupMessage');
        socket.off('messageDeleted');
      };
    }
  }, [selectedUser, selectedGroup, userData.email]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const message = {
        user: userData.username,
        email: userData.email,
        text: input,
        roomId: selectedUser ? getRoomId(userData.email, selectedUser.email) : selectedGroup.id,
      };
      if (selectedUser) {
        socket.emit('sendMessage', message);
      } else if (selectedGroup) {
        socket.emit('sendGroupMessage', message); 
      }
      setInput('');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:3000/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        socket.emit('messageDeleted', { deletedMessageId: messageId });
      } else {
        const errorData = await response.json();
        console.error('Failed to delete message:', errorData.message);
      }
    } catch (err) {
      console.error('Error deleting message:', err.message || err);
    }
  };

  const getRoomId = (email1, email2) => {
    const emails = [email1, email2].sort();
    return `room_${emails[0]}_${emails[1]}`;
  };

  return (
    <div className='AppChannelWrapperRight'>
      {selectedUser || selectedGroup ? (
        <>
          <h2>
            {selectedUser ? `Chat with ${selectedUser.name}` : `Group Chat: ${selectedGroup.name}`}
          </h2>
          <div className='chatWindow'>
            {messages.map((msg) => (
              <div key={msg._id} className={`message-item ${msg.email === userData.email ? 'myMessage' : 'userMessage'}`}>
                <div className='message-content'>
                  <strong className='username'>{msg.user || msg.username}</strong>
                  {msg.isDeleted ? (
                    <p className='message deleted'>This message was Deleted</p> 
                  ) : (
                    <p className='message'>{msg.text}</p>
                  )}
                  <span className='timestamp'>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                </div>
                {msg.email === userData.email && !msg.isDeleted && (
                  <button className='delete-btn' onClick={() => handleDeleteMessage(msg._id)}>
                    <i className="fas fa-trash-alt"></i>
                  </button>
                )}
              </div>
            ))}

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
        <p>Select a user or group to start chatting.</p>
      )
      }
    </div >
  );
}

export default ChannelRight;