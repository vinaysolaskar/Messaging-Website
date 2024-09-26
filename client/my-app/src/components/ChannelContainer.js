import React, { useState, useEffect } from 'react';
import ChannelLeft from './Direct-Message/ChannelLeft';
import ChannelRight from './Direct-Message/ChannelRight';
import GroupContainer from './GroupContainer';
import socket from './socket';

function ChannelContainer({ userData, room, onLogout, onRoomChange }) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (room) {
      socket.emit('joinRoom', room);
      console.log(`User ${socket.id} joined room ${room}`);
    }

    return () => {
      if (room) {
        socket.emit('leaveRoom', room);
        console.log(`User ${socket.id} left room ${room}`);
      }
    };
  }, [room]);

  useEffect(() => {
    if (userData && userData.email) {
      socket.emit('registerEmail', userData.email);
      console.log(`Registered email: ${userData.email}`);
    }
  }, [userData]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    localStorage.setItem('selectedUser', JSON.stringify(user));

    // Create room ID based on both users' emails
    const newRoom = getRoomId(userData.email, user.email);
    localStorage.setItem('currentRoom', newRoom);
    onRoomChange(newRoom); // Notify the parent to change the room
  };

  const getRoomId = (selectedEmail, userEmail) => {
    const emails = [selectedEmail, userEmail].sort();
    return `room_${emails[0]}_${emails[1]}`; // Create a unique room ID
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    onRoomChange(group.id); // Join the group room
  };

  return (
    <>
      <div className="AppChannelWrapperLeft">
        <ChannelLeft onSelectUser={handleSelectUser} onSelectGroup={handleSelectGroup} userData={userData} />
      </div>

      <div>
        <button className='logout-button' onClick={onLogout}>Logout</button>
      </div>

      <div className="AppChannelWrapperRight">
        <GroupContainer userData={userData} onLogout={onLogout} />
        <ChannelRight selectedUser={selectedUser} selectedGroup={selectedGroup} userData={userData} />
      </div>
    </>
  );
}

export default ChannelContainer;
