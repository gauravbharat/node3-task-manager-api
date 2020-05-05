const jwt = require('jsonwebtoken');
const User = require('../models/user');


// next arg is for registering this function as a middleware.
const auth = async (req, res, next) => {
  try {
    // Get the JWT token from the header and separate the prefix from it
    const token = req.header('Authorization').replace('Bearer ', '');

    // Verify the token with the secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get the user._id stored in the body/payload part of the JWT.
    // Search in the User collection for the user's existence and verify the sent token matches with the one stored in User document/record.
    const user = await User.findOne({ _id: decoded._id , 'tokens.token': token});

    if(!user) {
      throw new Error();
    }

    // Pass the found user object/document/record to the router handler to avoid any code for researching for the user record/document
    req.user = user;
    // Pass back the token to make reference of the current login system (web, mobile, etc.) and when logout, use this token to logout user from that specific login device and NOT all the other devices where user may have logged-in
    req.token = token;
    next();

  } catch (e) {
    // console.log(e);
    res.status(401).send({error: 'Please authenticate.'});
  }
};

module.exports = auth;