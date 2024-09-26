import React, { useState, useEffect } from 'react';
import socket from '../socket';

// Static data
const staticChannelHeaders = ['Announcements', 'Direct Messages'];
const staticChannelDMUserMapping = [
  {
    "channelId": "576315",
    "lastReadMsgId": "586806",
    "title": "Direct Message",
    "channelType": "DM",
    "schoolId": "40",
    "standardId": null,
    "divisionId": null,
    "boardId": 1,
    "lastMsgId": "587494",
    "academicYearId": "13",
    "academicYear": "2022-2023",
    "orgId": "2",
    "subtitle": null,
    "details": null,
    "hasNewMsg": true,
    "membersId": "11604",
    "usersCount": "2",
    "memberDetails": {
      "contactNo": "0",
      "email": "principal.powai@podar.org",
      "name": "Principal Powai",
      "photo": null,
      "role": "superadmin",
      "standard": null,
      "division": null,
      "subjectDetails": [],
      "isClassTeacher": false
    }
  },
  {
    "channelId": "588657",
    "lastReadMsgId": "585877",
    "title": "Direct Message",
    "channelType": "DM",
    "schoolId": "40",
    "standardId": "10",
    "divisionId": "1",
    "boardId": 1,
    "lastMsgId": "585877",
    "academicYearId": "13",
    "academicYear": "2022-2023",
    "orgId": "2",
    "subtitle": null,
    "details": null,
    "hasNewMsg": false,
    "membersId": "137313",
    "usersCount": "2",
    "memberDetails": {
      "contactNo": "7303711107",
      "email": "mamta.asingh@podar.org",
      "name": "Mamta Singh",
      "photo": null,
      "role": "Teacher",
      "standard": null,
      "division": null,
      "subjectDetails": [
        "Hindi",
        "Art and Craft",
        "General"
      ],
      "isClassTeacher": true
    }
  },
  {
    "channelId": "588657",
    "lastReadMsgId": "585877",
    "title": "Direct Message",
    "channelType": "DM",
    "schoolId": "40",
    "standardId": "10",
    "divisionId": "1",
    "boardId": 1,
    "lastMsgId": "585877",
    "academicYearId": "13",
    "academicYear": "2022-2023",
    "orgId": "2",
    "subtitle": null,
    "details": null,
    "hasNewMsg": false,
    "membersId": "137313",
    "usersCount": "2",
    "memberDetails": {
      "contactNo": "7303711107",
      "email": "student@podar.org",
      "name": "Student",
      "photo": null,
      "role": "Student",
      "standard": null,
      "division": null,
      "subjectDetails": [
        "Hindi",
        "Art and Craft",
        "General"
      ],
      "isClassTeacher": false
    }
  }
];

function ChannelLeft({ onSelectUser, onSelectGroup, userData }) {
  const [filteredChannelDMUserMapping, setFilteredChannelDMUserMapping] = useState([]);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupEmails, setGroupEmails] = useState('');
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    // Request groups from the server when the component mounts
    socket.emit('requestGroups');
  
    const handleGroupsUpdated = (updatedGroups) => {
      console.log('Groups updated received:', updatedGroups);
      setGroups(updatedGroups);
    };
  
    socket.on('groupsUpdated', handleGroupsUpdated);
  
    // Cleanup listener on unmount
    return () => {
      socket.off('groupsUpdated', handleGroupsUpdated);
    };
  }, []);
  

  useEffect(() => {
    const userEmail = userData?.email?.trim();
    const filtered = staticChannelDMUserMapping.filter(item => {
      const itemEmail = item.memberDetails.email?.trim();
      return itemEmail !== userEmail;
    });
    setFilteredChannelDMUserMapping(filtered);
  }, [userData]);

  const handleCreateGroup = () => {
    const emailsArray = groupEmails.split(',').map(email => email.trim()).filter(email => email);
    const newGroup = { id: `group${Date.now()}`, name: groupName, members: emailsArray }; // Use a unique ID

    const validMembers = staticChannelDMUserMapping.filter(item =>
      emailsArray.includes(item.memberDetails.email.trim())
    );

    if (validMembers.length > 0) {
      socket.emit('createGroup', newGroup, (createdGroup) => {
        console.log("Group created successfully:", createdGroup);

        // Update groups state with the created group
        setGroups(prevGroups => [...prevGroups, createdGroup]);

        // Reset form inputs
        setGroupName('');
        setGroupEmails('');
        setShowCreateGroupForm(false);
      });
    } else {
      alert('No valid members found for the group.');
    }
  };

  return (
    <div className='AppChannelWrapperLeft'>
      <h4 className='headerDm'>{staticChannelHeaders[0]}</h4>
      <h4 onClick={() => setShowCreateGroupForm(!showCreateGroupForm)} style={{ cursor: 'pointer' }}>
        Sections {showCreateGroupForm ? '-' : '+'}
      </h4>
      {showCreateGroupForm && (
        <div className="createGroupForm">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group Name"
            className="groupInput"
          />
          <input
            type="text"
            value={groupEmails}
            onChange={(e) => setGroupEmails(e.target.value)}
            placeholder="Enter emails separated by commas"
            className="groupInput"
          />
          <button onClick={handleCreateGroup} className="createGroupButton">Create Group</button>
        </div>
      )}
      <div>
        {groups.filter(group => group.members.includes(userData.email)).map((group) => (
          <div key={group.id} className='groupCard' onClick={() => onSelectGroup(group)}>
            <p><b>{group.name}</b></p>
          </div>
        ))}
      </div>
      <h4 className='headerDm'>{staticChannelHeaders[1]}</h4>
      <div>
        {filteredChannelDMUserMapping.map((item, index) => (
          <div
            key={index}
            className='memberCardDm'
            onClick={() => {
              console.log("Selected user:", item.memberDetails);
              onSelectUser(item.memberDetails);
            }}
          >
            <p><b>{item.memberDetails.name}</b></p>
            <p>{item.memberDetails.role}</p>
            <p>{item.memberDetails.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChannelLeft; 