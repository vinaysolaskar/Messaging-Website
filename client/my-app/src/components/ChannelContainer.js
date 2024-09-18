import React, { useState, useEffect } from 'react';
import ChannelLeft from './ChannelLeft';
import ChannelRight from './ChannelRight';
import socket from './socket';

function ChannelContainer({ userData, room, onLogout, onRoomChange }) {
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const storedSelectedUser = localStorage.getItem('selectedUser');
    if (storedSelectedUser) {
      setSelectedUser(JSON.parse(storedSelectedUser));
    }
  }, []);

  useEffect(() => {
    const handleConnect = async () => {
      if (room) {
        await new Promise((resolve) => {
          socket.on('connect', resolve);
        });

        socket.emit('joinRoom', room);
        console.log(`User ${socket.id} joined room ${room}`);
      }
    };

    handleConnect();

    return () => {
      if (room) {
        socket.emit('leaveRoom', room);
        console.log(`User ${socket.id} left room ${room}`);
      }
    };
  }, [room]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    localStorage.setItem('selectedUser', JSON.stringify(user));
    // const storedRoom = localStorage.getItem('currentRoom');
    // if (storedRoom) {
    //   onRoomChange(storedRoom);
    // } else {
    //   const newRoom = getRoomId(userData.email, user.email);
    //   localStorage.setItem('currentRoom', newRoom);
    //   onRoomChange(newRoom);
    // }
      setSelectedUser(user);
      localStorage.setItem('selectedUser', JSON.stringify(user));
      const newRoom = getRoomId(userData.email, user.email);
      localStorage.setItem('currentRoom', newRoom);
      onRoomChange(newRoom);    
  };

  function getRoomId(selectedEmail, userEmail) {
    const emails = [selectedEmail, userEmail].sort();
    return `room_${emails[0]}_${emails[1]}`;
  }

  return (
    <>
      <div className="AppChannelWrapperLeft">
        <ChannelLeft onSelectUser={handleSelectUser} userData={userData} />
      </div>

      <div>
        <button className='logout-button' onClick={onLogout}>Logout</button>
      </div>

      <div className="AppChannelWrapperRight">
        {selectedUser && room ? (
          <ChannelRight selectedUser={selectedUser} userData={userData} room={room} />
        ) : (
          <p>Select a user to start chatting.</p>
        )}
      </div>
    </>
  );
}

export default ChannelContainer;
