const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const mongoose = require('../db/mongoose');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendEmailOnCancellation } = require('../emails/account');

const router = new express.Router();

// sign-up
router.post('/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();

    sendWelcomeEmail(newUser.email, newUser.name)
    const token = await newUser.generateAuthToken();
    
    

    // user object instance is getting implicitly stringified by the res.send() method, thus, calling
    // the user.toJSON() method for removing the password and tokens data from being sent
    res.status(201).send({newUser, token});
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    // user object instance is getting implicitly stringified by the res.send() method, thus, calling
    // the user.toJSON() method for removing the password and tokens data from being sent
    res.send({ user, token });
  } catch (e) {
    // console.log(e);
    res.status(400).send();
  }
});

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

// Set the destination directory as 'avatar' to store the uploads
// limit the file size to 1mb
// REMOVE the dest property so that multer does not save the upload in a specified file folder but
// instead pass the data to the caller route to process it further i.e. save it on the user profile
const upload = multer({
  // dest: 'avatar',
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image'));
    }

    // return undefined for error and accept file by passing true in the callback
    cb(undefined, true);
  }
});

// Passing multiple middlewares: auth and multer upload
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  
  try {

    // Get the multer processed and returned file data buffer (binary image data), and
    // pass it on to sharp for processing the image: resize and convert to png
    // Reconvert the data to a buffer, i.e. binary data
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()

    // // Save the sharp modified image in user.avatar binary data field
    req.user.avatar = buffer;

    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
  
}, (error, req, res, next) => {
  res.status(400).send({error: error.message});
}); 

router.get('/users/:id/avatar', auth, async (req, res) => {
  const _id = req.params.id;

  if(!mongoose.isValidObjectId(_id)) {
    return res.status(400).send('Use valid user Id to fetch data');
  }

  try {
    const user = await User.findById(_id)

    if(!user || !user.avatar) {
      throw new Error();
    }

    // Let the user know the type of data they would get back by
    // setting a response header with a key=value pair as
    res.set('Content-Type', 'image/png');
    // More on above, express automatically sends the header for the return data type, for example -
    // 'Content-Type'='application/json'

    res.send(user.avatar);

  } catch (e) {
    res.status(404).send();
  }
});

// send user profile 
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

// update
router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if(!isValidOperation) {
    return res.status(400).send('error: Invalid updates!');
  }

  try {
    updates.forEach(update => { req.user[update] = req.body[update]; });
    await req.user.save();
    res.send(req.user);

  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }

});

// delete
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    sendEmailOnCancellation(req.user.email, req.user.name)
    res.send(`Deleted user: ${req.user}`);

  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;

// router.get('/users', auth, async (req, res) => {
//   // Only for admin users
//   try {
//     const users = await User.find({});
//     res.send(users);
    
//   } catch (e) {
//     res.status(500).send(e);
//   }
// });

// // send specific user data by ID, for admin access
// router.get('/users/:id', auth, async (req, res) => {
//   const _id = req.params.id;

//   if(!mongoose.isValidObjectId(_id)) {
//     return res.status(400).send('Use valid user Id to fetch data');
//   }

//   try {
//     // String Id automatically converted to Object Id by mongoose, so not explicit conversion required here
//     const user = await User.findById(_id);
    
//     if(!user) {
//       return res.status(404).send('User not found');
//     }
    
//     res.send(user);

//   } catch (e) {
//     res.status(500).send(e);
//   }

// });

// // updating a user by ID, for admin
// router.patch('/users/:id', auth, async (req, res) => {
//   const updates = Object.keys(req.body);
//   const allowedUpdates = ['name', 'email', 'password', 'age'];
//   const isValidOperation = updates.every(update => allowedUpdates.includes(update));

//   const _id = req.params.id;

//   if(!isValidOperation) {
//     return res.status(400).send('error: Invalid updates!');
//   }

//   if(!mongoose.isValidObjectId(_id)) {
//     return res.status(400).send('Use valid user Id to fetch data');
//   }

//   try {

//     /*
//     // new: true, returns the updated user
//     // runValidators: true, performs field validations
//     const user = await User.findByIdAndUpdate(
//       _id, 
//       req.body, 
//       { 
//         new: true,
//         runValidators: true
//       }  
//     ); */

//     // findByIdAndUpdate bypasses mongoose and does a direct operation on the database
//     // Now for the document middleware to work, use mongoose methods to update records as follows -
//     // 1. Get the user document/record to update
//     const user = await User.findById(_id);

//     if(!user) {
//       return res.status(400).send();
//     }

//     // 2. Set the user object document property with the value user desires to update
//     updates.forEach(update => { user[update] = req.body[update]; });

//     // 3. Save the user document by calling the mongoose save method
//     await user.save();

//     res.send(user);

//   } catch (e) {
//     res.status(400).send(e);
//   }
// });

// // deleting a user by ID, for admin users
// router.delete('/users/:id', auth, async (req, res) => {
//   const _id = req.params.id;

//   if(!mongoose.isValidObjectId(_id)) {
//     return res.status(400).send('Use valid user Id to fetch data');
//   }

//   try {
//     const user = await User.findByIdAndDelete(_id);

//     if(!user) {
//       return res.status(404).send();
//     }

//     res.send(`Deleted user: ${user}`);

//   } catch (e) {
//     res.status(500).send(e);
//   }
// });

