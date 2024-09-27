import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  text: { type: String, required: true },
  email:{type: String, require: true},
  room: { type: String, required: true },
  target: { type: String, default: 'all' },
  senderId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  deleted: { type: Boolean, default: false }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
