const express = require('express');
const mongoose = require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;

// // Add this BEFORE all OTHER app.use calls
// // next arg is for registering this function as a middleware.
// app.use((req, res, next) => {
//   // console.log(req.method, req.path);
//   // // call next() for route handler to run
//   // next(); 

//   // if(req.method === 'GET') {

//   // } else {
//   //   next();
//   // }

//   res.status(503).send('Site is currently under maintenance. Check back soon!');

// });

// Setup the middleware using app.use.
// Parse incoming JSON data, so that it autamatiacally parse incoming json to an object. This will be added to the express middleware stack and it will be triggered on any route (e.g. get/post/patch/delete, etc.). In short, app.use is called every time a request is sent to the server.
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});