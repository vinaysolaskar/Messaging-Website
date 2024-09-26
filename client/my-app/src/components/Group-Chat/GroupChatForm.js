import React, { useState } from 'react';
import socket from '../socket';

function GroupForm({ onGroupCreated }) {
  const [emails, setEmails] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailList = emails.split(',').map(email => email.trim());
    
    const newGroup = {
      id: Date.now(), // or use a unique ID generator
      name: `Group ${Date.now()}`,
      emails: emailList,
    };

    socket.emit('createGroup', newGroup);
    onGroupCreated(newGroup); // Call the function passed from parent
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        value={emails} 
        onChange={(e) => setEmails(e.target.value)} 
        placeholder="Enter emails separated by commas"
      />
      <button type="submit">Create Group</button>
    </form>
  );
}

export default GroupForm;
