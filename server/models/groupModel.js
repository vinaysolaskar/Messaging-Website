import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  members: [{ type: String, required: true }], // List of member emails
  createdAt: { type: Date, default: Date.now },
});

const Group = mongoose.model('Group', groupSchema);

export default Group;
