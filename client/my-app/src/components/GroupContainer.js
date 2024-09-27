import React, { useState, useEffect } from 'react';
import socket from './socket';

function GroupContainer({ userData, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showForm, setShowForm] = useState(false); // Add state to manage form visibility

  useEffect(() => {
    socket.on('groupsUpdated', (newGroups) => {
      setGroups(newGroups);
    });

    return () => {
      socket.off('groupsUpdated');
    };
  }, []);

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
  };

//   return (
    // <div>
    //   <h2>Group Chats</h2>
    //   <button onClick={() => setShowForm(!showForm)}>
    //     {showForm ? 'Cancel' : 'Create New Group'}
    //   </button>
    //   {showForm && (
    //     <GroupForm 
    //       onGroupCreated={(newGroup) => {
    //         setGroups((prev) => [...prev, newGroup]);
    //         setShowForm(false); // Hide the form after creating a group
    //       }} 
    //     />
    //   )}
    //   <div>
    //     {groups.map((group) => (
    //       <div key={group.id} onClick={() => handleSelectGroup(group)}>
    //         {group.name}
    //       </div>
    //     ))}
    //   </div>
    //   {selectedGroup && <GroupChat group={selectedGroup} userData={userData} />}
    //   <button className='logout-button' onClick={onLogout}>Logout</button>
    // </div>
//   );
}

export default GroupContainer;
