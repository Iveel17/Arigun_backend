import mongoose from 'mongoose';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: [6, 'Minimum password length is 6 characters']
  }
});

// fire a function *before* the document is saved to the database
userSchema.pre('save', function (next) {
  console.log('🟡 User about to be created & saved:', this);
  next();
});

// fire a function *after* the document is saved to the database
userSchema.post('save', function (doc, next) {
  console.log('🟢 New user was created & saved:', doc);
  next();
});


const User = mongoose.model('User', userSchema);
export default User;
