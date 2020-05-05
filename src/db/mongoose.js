const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true, 
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

module.exports = mongoose;


// const task = new Task({
//   description: 'Check account balance'
// });

// task.save()
// .then(() => {
//   console.log(task);
// })
// .catch(error => {
//   console.log(error.message);
// })

// const me = new User({
//   name: 'Laary',
//   email: 'gary@dsouza.in',
//   age: 40,
//   password: 'test'
// });

// me.save()
// .then(() => {
//   console.log(me);
// })
// .catch(error => {
//   console.log(error.message);
// })

