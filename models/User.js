import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';

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
  },
  // Optional: Add role-specific metadata
  teacherData: {
    department: String,
    subjects: [String],
    isVerified: { type: Boolean, default: false }
  },
  adminData: {
    permissions: [String],
    canManageUsers: { type: Boolean, default: false },
    canManageContent: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Instance method to check if user has required role or higher
userSchema.methods.hasRole = function(requiredRole) {
  return ROLE_HIERARCHY[this.role] >= ROLE_HIERARCHY[requiredRole];
};

// Instance method to check if user has specific permission
userSchema.methods.hasPermission = function(permission) {
  switch (this.role) {
    case ROLES.ADMIN:
      return true; // Admin has all permissions
    case ROLES.TEACHER:
      // Define teacher permissions
      const teacherPermissions = [
        'read_courses',
        'create_courses',
        'update_own_courses',
        'delete_own_courses',
        'manage_students',
        'grade_assignments'
      ];
      return teacherPermissions.includes(permission);
    case ROLES.USER:
      // Define user permissions
      const userPermissions = [
        'read_courses',
        'enroll_courses',
        'view_own_profile',
        'update_own_profile'
      ];
      return userPermissions.includes(permission);
    case ROLES.GUEST:
      // Define guest permissions
      const guestPermissions = [
        'view_public_content'
      ];
      return guestPermissions.includes(permission);
    default:
      return false;
  }
};

// Static method to get default guest user object
userSchema.statics.getGuestUser = function() {
  return {
    id: null,
    firstName: 'Guest',
    lastName: 'User',
    email: null,
    role: ROLES.GUEST,
    hasRole: function(requiredRole) {
      return ROLE_HIERARCHY[ROLES.GUEST] >= ROLE_HIERARCHY[requiredRole];
    },
    hasPermission: function(permission) {
      const guestPermissions = ['view_public_content'];
      return guestPermissions.includes(permission);
    }
  };
};

// fire a function *before* the document is saved to the database
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
});

// fire a function *after* the document is saved to the database
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

const User = mongoose.model('User', userSchema);
export default User;