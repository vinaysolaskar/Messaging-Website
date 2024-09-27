import React, { useState, useEffect } from 'react';
import ChannelContainer from './components/ChannelContainer';
import Login from './components/Login';
import './App.css';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('userData'));
    const storedRoom = localStorage.getItem('room');

    if (storedUserData) {
      setUserData(storedUserData);
      setIsLoggedIn(true);
      if (storedRoom) {
        setRoom(storedRoom);
      }
    }
  }, []);

  useEffect(() => {
    const joinRoom = async () => {
      if (room) {
        await new Promise((resolve) => {
          socket.on('connect', resolve);
        });

        socket.emit('joinRoom', room);
        console.log(`User ${socket.id} joined room ${room}`);
      }
    };

    joinRoom();

    return () => {
      if (room) {
        socket.emit('leaveRoom', room);
        console.log(`User ${socket.id} left room ${room}`);
      }
    };
  }, [room]);

  const handleLogin = (user) => {
    setUserData(user);
    setIsLoggedIn(true);
    localStorage.setItem('userData', JSON.stringify(user));
  };

  const handleLogout = () => {
    setUserData(null);
    setRoom(null);
    setIsLoggedIn(false);
    localStorage.removeItem('userData');
    localStorage.removeItem('room');
    socket.emit('leaveRoom', room);
  };

  const handleRoomChange = (newRoom) => {
    setRoom(newRoom);
    localStorage.setItem('room', newRoom);
    socket.emit('joinRoom', newRoom);
  };

  return (
    <div className="AppChannel">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <ChannelContainer 
            userData={userData} 
            room={room}
            onLogout={handleLogout}
            onRoomChange={handleRoomChange}
          />
          {/* <GroupContainer
            userData={userData}
            onLogout={handleLogout}
          /> */}
        </>
      )}
    </div>
  );
}

export default App;
