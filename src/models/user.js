const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

// Set timestamps = true for storing the createdAt and updatedAt at fields
const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if(!validator.isEmail(value)) {
        throw new Error('Email is invalid');
      }
    }
  },
  age: { 
    type: Number, 
    default: 0,
    validate(value) {
      if(value < 0) {
        throw new Error('Age must be a positive number');
      }
    } 
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: [7, 'Password cannot be less than 7 characters'],
    validate(value) {
      if(value.toLowerCase().includes('password')) {
        throw new Error('Password cannot contain the string \'password\'');
      }
    }
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  avatar: {
    type: Buffer
  }
}, { timestamps: true });

// To fetch user specific tasks, by way of parent-child reference, add 
// a virtual reference to the child Collection/Model
// The local field is the unique identifier of the parent colection stored in the child collection,
// that is the user ID in this case (_id) and the ref field that stores this value in the child
// collection 'Task' is the 'owner' field/column.
userSchema.virtual('myTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
});

// toJSON() is called everytime an object is stringified (e.g. JSON.stringify), whether implicitly or explicitly. 
// In this case, the toJSON is set on the user instance. So, when the res.send() is passed with the user instance object as an argument, 
// it is implicitly stringified by the res.send() method when it calls the JSON.stringify() behind the scenes.
// Now, toJSON executes BEFORE the stringify process and thus executing the code within that to remove the password and tokens from the user object instance.
userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  // Delete password and tokens being sent back to the caller in the user object,
  // thus hiding private data and NOT exposing it to the route caller/requestor
  delete userObject.password;
  delete userObject.tokens;

  // Remove the large avatar data from sent back
  delete userObject.avatar;

  return userObject;
};

// methods === instance methods, available on the instance of that model
// created for the specific user instance
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  // Convert ObjectID to string, which the jwt expects for the payload/body
  // Use the JWT base 64 secret
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  // add new token to the user array
  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

// statics === model methods, are accessible on the models. Exported const "User" in this case
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if(!user) {
    throw new Error('Unable to login')
  }

  const isMatch = await bcryptjs.compare(password, user.password);
  if(!isMatch) {
    throw new Error('Unable to login')
  }

  return user;
};

// Hash the plain text password before saving
// pre and post, eg. before and after
// Add document middleware to schema before the 'save' action
// Use standard function not an arrow function as the second argument because does not bind 'this and 
// 'this' i.e. current document/record binding is required in this case 
userSchema.pre('save', async function(next) {
  // 'this' gives access to the individual user that is about to be saved i.e. the current document/record
  const user = this;

  // Only hash if user is first created or password is modified by the user
  if(user.isModified('password')){
    user.password = await bcryptjs.hash(user.password, 8);
  }

  // call for the next code to execute, after this middleware 
  next();
});

// Delete user tasks when user is removed
userSchema.pre('remove', async function(next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

// We could define the field definitions (object), directly inside the model as a second argument
// However, to apply middleware, the field definitions object needs to be created as a Schema, and
// the Schema object is then passed as a second argument to the mongoose.model function 
const User = mongoose.model('User', userSchema);

module.exports = User;