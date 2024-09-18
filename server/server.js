import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from './models/messageModel.js';
import cors from 'cors';

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

// Socket.io logic
io.on('connection', (socket) => {
  socket.on('joinRoom', async (room) => {
    socket.join(room);

    const previousMessages = await Message.find({ room }).sort({ createdAt: 1 }).exec();
    socket.emit('previousMessages', previousMessages.map(msg => ({
      ...msg.toObject(),
      user: msg.username
    })));
  });

  socket.on('sendMessage', async (message) => {
    console.log('Received message on server:', message);
    const timestamp = new Date().toISOString();
    console.log('Generated timestamp:', timestamp);
  
    const newMessage = new Message({
      username: message.user,
      text: message.text,
      room: message.room,
      target: message.target || 'all',
      senderId: socket.id,
    });    
  
    try {
      const savedMessage = await newMessage.save();
      console.log('Message saved to MongoDB:', savedMessage);
  
      // // Check if createdAt is a valid date before sending it
      // const createdAt = savedMessage.createdAt;
      // console.log('CreatedAt from DB:', createdAt);
  
      // Ensure the date is being emitted as a valid ISO string
      io.to(message.room).emit('message', {
        user: savedMessage.username,
        text: savedMessage.text,
        room: savedMessage.room,
        createdAt: new Date().toISOString() // Use toISOString to format date
      });
    } catch (err) {
      console.error('Error saving message to MongoDB:', err);
    }
  });
  

  socket.on('leaveRoom', (room) => {
    socket.leave(room);
  });

  socket.on('disconnect', () => {
    // Handle user disconnect
  });
});

app.delete('/api/messages', async (req, res) => {
  const { room } = req.body;
  if (!room) {
    return res.status(400).json({ error: 'Room is required' });
  }

  try {
    await Message.deleteMany({ room });
    console.log('Deleted messages for room:', room);
    res.status(200).json({ message: 'Messages deleted successfully' });
    
    // Notify clients about message deletion
    io.to(room).emit('messagesDeleted');
  } catch (err) {
    console.error('Error deleting messages:', err);
    res.status(500).json({ error: 'Failed to delete messages' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
