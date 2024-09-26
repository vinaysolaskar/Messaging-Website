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
  origin: 'http://localhost:3001', // Adjust as needed
  methods: ['GET', 'POST', 'DELETE']
}));

app.use(express.json()); // This will parse JSON bodies

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, '../client/my-app/public')));

// Serve HTML files
app.get('/groupform', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/my-app/public', 'groupform.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/my-app/public', 'index.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Track socket IDs by email
const emailToSocketId = {};

// Socket.io logic
io.on('connection', (socket) => {

  socket.on('requestGroups', async () => {
    try {
      const groups = await Group.find(); // Always fetch latest groups
      // console.log('groups are: ', groups);
      socket.emit('groupsUpdated', groups);
    } catch (err) {
      console.error('Error fetching groups:', err);
      socket.emit('groupsUpdated', []); // Send empty array on error
    }
  });

  // Register user email with socket
  socket.on('registerEmail', (email) => {
    emailToSocketId[email] = socket.id;
  });

  socket.on('joinRoom', async (room) => {
    socket.join(room);
    const previousMessages = await Message.find({ room, deleted: false }).sort({ createdAt: 1 }).exec();
    // console.log('previousMessages', previousMessages);
    socket.emit('previousMessages', previousMessages.map(msg => ({
      ...msg.toObject(),
      user: msg.username
    })));
  });

  socket.on('sendMessage', async (message) => {
    // console.log('Received message on server:', message);
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
      // console.log('Message saved to MongoDB:', savedMessage);
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
    // console.log('group:', group);
    const newGroup = new Group({
      id: uuidv4(), // Generate a consistent group ID
      name: group.name,
      members: group.members,
    });
    try {
      const savedGroup = await newGroup.save();
      // console.log('New group created and saved to MongoDB:', savedGroup);
      // Fetch all groups from MongoDB and send the updated list

      // Emit the created group back to the creator
      callback(savedGroup);

      const allGroups = await Group.find();
      io.emit('groupsUpdated', allGroups); // Notify clients
      // callback(savedGroup); // Return created group
    } catch (err) {
      console.error('Error saving group to MongoDB:', err);
      callback(null); // Notify client of failure
    }
  });

  socket.on('joinGroup', async (groupId) => {
    const groups = await loadGroups(); // Always fetch latest groups
    const group = groups.find(g => g.id === groupId);
    if (group) {
      socket.join(groupId);
      const messageFound = await Message.find({ room: groupId }).exec();
      socket.emit('previousGroupMessages', messageFound);
    } else {
      console.error('Group not found:', groupId);
    }
  });

  socket.on('sendGroupMessage', async (message) => {
    // console.log('Received group message:', message);
    const group = await Group.findOne({ id: message.roomId }); // Find group by ID
  
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
        // console.log('Group message saved:', newMessage);
  
        // Emit the new message to the specific group room
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
    // Clean up email to socket mapping
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
    console.log('Attempting to delete message with ID:', id); // Log the ID
    const deletedMessage = await Message.findById(id);
    if (!deletedMessage) {
      console.warn('Message not found:', id); // More specific warning
      return res.status(404).json({ message: 'Message not found' });
    }
    
    deletedMessage.deleted = true; // Mark as deleted
    await deletedMessage.save();

    // Notify clients about the deletion
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
    // console.log('Loaded groups from MongoDB:', savedGroups);
    return savedGroups; // Return the loaded groups
  } catch (err) {
    console.error('Error loading groups from MongoDB:', err);
    return [];
  }
};

const PORT = process.env.PORT || 3000;
server.listen(PORT, async() => {
  console.log(`Server running at http://localhost:${PORT}`);
  const initialGroups = await loadGroups();
  io.emit('groupsUpdated', initialGroups); // Emit groups to all clients
});
