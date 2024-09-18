// ./client/my-app/src/components/Group-Chat/GroupChatForm.js
import React, { useState } from 'react';
import axios from 'axios';

const GroupChatForm = () => {
  const [groupName, setGroupName] = useState('');
  const [emails, setEmails] = useState('');
  const [hostEmail, setHostEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!groupName || !emails || !hostEmail) {
      setError('Please fill out all fields.');
      return;
    }

    const emailList = emails.split(',').map(email => email.trim());

    try {
      const response = await axios.post('http://localhost:3000/groups', {
        groupName,
        hostEmail,
        participantEmails: emailList,
      });

      if (response.status === 201) {
        setSuccess('Group created successfully!');
        setGroupName('');
        setEmails('');
        setHostEmail('');
      }
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group. Try again later.');
    }
  };

  return (
    <div className="group-chat-form">
      <h2>Create a New Group</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Group Name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
          />
        </div>
        <div className="form-group">
          <label>Host Email</label>
          <input
            type="email"
            value={hostEmail}
            onChange={(e) => setHostEmail(e.target.value)}
            placeholder="Enter host email"
          />
        </div>
        <div className="form-group">
          <label>Participant Emails (comma separated)</label>
          <input
            type="text"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="Enter participant emails"
          />
        </div>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit">Create Group</button>
      </form>
    </div>
  );
};

export default GroupChatForm;
