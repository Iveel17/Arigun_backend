import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';

// DONT TOUCH ⚠️


// Define available roles
export const ROLES = {
  GUEST: 'guest',
  USER: 'user',
  TEACHER: 'teacher',
  ADMIN: 'admin'
};

// Define role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  [ROLES.GUEST]: 0,
  [ROLES.USER]: 1,
  [ROLES.TEACHER]: 2,
  [ROLES.ADMIN]: 3
};
// Permissions mapped to minimum required role
export const PERMISSIONS = {
  'read items': ROLES.GUEST,
  'access public sections': ROLES.GUEST,
  'access cart, notification sections': ROLES.USER,
  'enroll in courses': ROLES.USER,
  'view enrollments': ROLES.USER,
  'add courses': ROLES.TEACHER,
  'can access plus section': ROLES.TEACHER,
  'delete items': ROLES.ADMIN,
  'update items': ROLES.ADMIN
  // Add more as needed, e.g., 'manage users': ROLES.ADMIN for exclusive admin stuff
};
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please enter your first name'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please enter your last name'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
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
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.USER,
    required: true
  },
  termsAgreed: {
    type: Boolean,
    required: [true, 'You must agree to the terms and conditions'],
    validate: {
      validator: function(v) {
        return v === true;
      },
      message: 'You must agree to the terms and conditions'
    }
  }
}, {
  timestamps: true
});

// DONT TOUCH ⚠️


// Instance method to check if user has required role or higher
userSchema.methods.hasRole = function(requiredRole) {
  return ROLE_HIERARCHY[this.role] >= ROLE_HIERARCHY[requiredRole];
};

// Checks permission.Hierarchy for cumulative checks
userSchema.methods.hasPermission = function(permission) {
  if (!PERMISSIONS[permission]) {
    return false;  // Undefined permission defaults to denied
  }
  const requiredRole = PERMISSIONS[permission];
  return this.hasRole(requiredRole) && this.isActive;  // Also checks if active
};

// GET GUEST USER
userSchema.statics.getGuestUser = function() {
  return {
    id: null,
    firstName: 'Guest',
    lastName: 'User',
    email: null,
    role: ROLES.GUEST,
    isActive: true,  // Guests are always "active"
    hasRole: function(requiredRole) {
      return ROLE_HIERARCHY[ROLES.GUEST] >= ROLE_HIERARCHY[requiredRole];
    },
    hasPermission: function(permission) {
      if (!PERMISSIONS[permission]) {
        return false;
      }
      const requiredRole = PERMISSIONS[permission];
      return ROLE_HIERARCHY[ROLES.GUEST] >= ROLE_HIERARCHY[requiredRole];
    }
  };
};

// DONT TOUCH ⚠️

// hashes the password, *before* the document is saved to the db
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
});

// DEBUG fire a function *after* the document is saved to the database
userSchema.post('save', function (doc, next) {
  console.log('🟢 New user was created & saved:', {
    id: doc._id,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    role: doc.role
  });
  next();
});

// static method to login user
userSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error('incorrect password');
  }
  throw Error('incorrect email');
};

// DONT TOUCH ⚠️

const User = mongoose.model('User', userSchema);
export default User;