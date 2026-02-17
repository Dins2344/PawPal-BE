const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: Number,
});

// The model name 'User' corresponds to the 'users' collection in MongoDB
const User = mongoose.model('User', userSchema);

module.exports = User;