import React, { useState,useEffect } from 'react';

// Static data
const staticChannelHeaders = ['Announcements', 'Sections', 'Direct Messages'];
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

function ChannelLeft({ onSelectUser, userData }) {
  // Check if userData is defined before accessing its properties
  const [filteredChannelDMUserMapping, setFilteredChannelDMUserMapping] = useState([]);

  useEffect(() => {
    const userEmail = userData?.email?.trim();
  
    const filtered = staticChannelDMUserMapping.filter(item => {
      const itemEmail = item.memberDetails.email?.trim();
      return itemEmail !== userEmail;
    });
  
    setFilteredChannelDMUserMapping(filtered);
  }, [userData]);

  return (
    <div className='AppChannelWrapperLeft'>
      {staticChannelHeaders.map((header, index) => (
        <h4 key={index} className='headerDm'>{header}</h4>
      ))}

      <div>
        {filteredChannelDMUserMapping.map((item, index) => (
          <div
            key={index}
            className='memberCardDm'
            onClick={() => {
              // console.log('User selected:', item.memberDetails);
              onSelectUser(item.memberDetails)
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

