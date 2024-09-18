import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  username: String,
  text: String,
  room: String,
  target: { type: String, default: 'all' },
  senderId: String,
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

export default Message;
