import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from './models/messageModel.js';
import Group from './models/groupModel.js';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'DELETE']
}));

app.use(express.json()); 
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, '../client/my-app/public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/my-app/public', 'index.html'));
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

const emailToSocketId = {};
io.on('connection', (socket) => {

  socket.on('requestGroups', async () => {
    try {
      const groups = await Group.find();
      socket.emit('groupsUpdated', groups);
    } catch (err) {
      console.error('Error fetching groups:', err);
      socket.emit('groupsUpdated', []); 
    }
  });

  socket.on('registerEmail', (email) => {
    emailToSocketId[email] = socket.id;
  });

  socket.on('joinRoom', async (room) => {
    socket.join(room);
    const previousMessages = await Message.find({ room }).sort({ createdAt: 1 }).exec();
    console.log('Previous messages for room:', room, previousMessages);
    socket.emit('previousMessages', previousMessages.map(msg => ({
      ...msg.toObject(),
      user: msg.username,
      isDeleted: msg.deleted,
    })));
  });  

  socket.on('sendMessage', async (message) => {
    const timestamp = new Date().toISOString();
    const newMessage = new Message({  
      username: message.user,
      text: message.text,
      email: message.email,
      room: message.roomId,
      target: message.target || 'all',
      senderId: socket.id,
      createdAt: timestamp,
    });

    try {
      const savedMessage = await newMessage.save();
      io.to(message.roomId).emit('message', {
        _id: savedMessage._id,
        user: savedMessage.username,
        text: savedMessage.text,
        email: savedMessage.email,
        room: savedMessage.room,
        createdAt: savedMessage.createdAt
      });
    } catch (err) {
      console.error('Error saving message to MongoDB:', err);
    }
  });

  socket.on('leaveRoom', (room) => {
    socket.leave(room);
  });

  socket.on('createGroup', async (group, callback) => {
    const newGroup = new Group({
      id: uuidv4(),
      name: group.name,
      members: group.members,
    });
    try {
      const savedGroup = await newGroup.save();
      callback(savedGroup);
      const allGroups = await Group.find();
      io.emit('groupsUpdated', allGroups);
    } catch (err) {
      console.error('Error saving group to MongoDB:', err);
      callback(null); 
    }
  });

  socket.on('joinGroup', async (groupId) => {
    const groups = await loadGroups(); 
    const group = groups.find(g => g.id === groupId);
    if (group) {
      socket.join(groupId);
      const messageFound = await Message.find({  room: groupId }).exec();
      console.log('Previous messages for group:', groupId, messageFound);
      socket.emit('previousGroupMessages', messageFound.map(msg => ({
        ...msg.toObject(),
        isDeleted: msg.deleted, 
      })));
    } else {
      console.error('Group not found:', groupId);
    }
  });

  socket.on('sendGroupMessage', async (message) => {
    const group = await Group.findOne({ id: message.roomId }); 
  
    if (!group) {
      console.error('Group not found:', message.roomId);
      return;
    }
  
    if (group.members.includes(message.email)) {
      const newMessage = new Message({
        username: message.user,
        text: message.text,
        email: message.email,
        room: group.id,
        senderId: socket.id,
        createdAt: new Date(),
        groupId: group._id
      });
  
      try {
        await newMessage.save();
        io.to(group.id).emit('groupMessage', {
          _id: newMessage._id,
          user: newMessage.username,
          text: newMessage.text,
          email: newMessage.email,
          createdAt: newMessage.createdAt
        });
      } catch (err) {
        console.error('Error saving group message:', err);
        socket.emit('errorMessage', 'Failed to send message.');
      }
    } else {
      console.error(`User not authorized to send message to this group: ${message.user} is not a member`);
      socket.emit('errorMessage', 'You are not authorized to send messages in this group.');
    }
  });
  
  socket.on('leaveGroup', (groupId) => {
    socket.leave(groupId);
  });

  socket.on('disconnect', () => {
    Object.keys(emailToSocketId).forEach(email => {
      if (emailToSocketId[email] === socket.id) {
        delete emailToSocketId[email];
      }
    });
  });
});

app.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMessage = await Message.findById(id);
    if (!deletedMessage) {
      console.warn('Message not found:', id); 
      return res.status(404).json({ message: 'Message not found' });
    }
    
    deletedMessage.deleted = true; 
    await deletedMessage.save();

    const deletionNotice = {
      deletedMessageId: id,
      user: deletedMessage.username,
      text: 'This message was deleted.',
      createdAt: deletedMessage.createdAt,
      groupId: deletedMessage.groupId,
      room: deletedMessage.room,
      email: deletedMessage.email,
      isDeleted: true,
    };
    
    io.emit('messageDeleted', deletionNotice);
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const loadGroups = async () => {
  try {
    const savedGroups = await Group.find();
    return savedGroups;
  } catch (err) {
    console.error('Error loading groups from MongoDB:', err);
    return [];
  }
};

const PORT = process.env.PORT || 3000;
server.listen(PORT, async() => {
  console.log(`Server running at http://localhost:${PORT}`);
  const initialGroups = await loadGroups();
  io.emit('groupsUpdated', initialGroups);
});
