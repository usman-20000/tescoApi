const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  generatedId: {
    type: String,
    unique: true,
    required: true,
  },
  referalCode: {
    type: String,
  },
});

const Register = mongoose.model('Register', registerSchema);

module.exports = Register;
