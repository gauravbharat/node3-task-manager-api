const express = require('express');
const mongoose = require('../db/mongoose');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

// create task
router.post('/tasks', auth, async (req, res) => {
  // const newTask = new Task(req.body);
  const newTask = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    await newTask.save();
    res.status(201).send(newTask);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/tasks', auth, async (req, res) => {
  const match = {};
  const sort = {};
  
  if(req.query.completed) {
    match.completed = req.query.completed === 'true'
  }

  // sortBy=createdAt:desc
  if(req.query.sortBy) {
    // spilt values by colon, createdAt:desc
    const parts = req.query.sortBy.split(':');
    // Set the field name as property and the its value
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  try {
    // First approach to search tasks/documents from the Task collection by the onwer user ID, OR
    // Use the populate method to get the tasks for the current user
    // const tasks = await Task.find({ owner: req.user._id });

    // 1. Filter data using match option inside populate: GET /tasks?completed=true
    // 2. Paginate data using limit and skip options into option property: GET /tasks?limit=10&skip=0
    // 3. Sort data using sort property inside options object. Set the field to sort from and the value of 1 for ascending and -1 for descending : GET /tasks?sortBy=createdAt:desc
    await req.user.populate({
      path: 'myTasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate();
    res.send(req.user.myTasks);
  } catch (e) {
    res.status(500).send(e);
  }
});


router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  if(!mongoose.isValidObjectId(_id)) {
    return res.status(400).send('Use valid task Id to fetch data');
  }

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if(!task) {
      return res.status(404).send('Task not found');
    }

    return res.send(task);

  } catch (e) {
    res.status(500).send(e);
  }
});

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  const _id = req.params.id;

  if(!isValidOperation) {
    return res.status(400).send('error: Invalid updates!');
  }

  if(!mongoose.isValidObjectId(_id)) {
    return res.status(400).send('Invalid task Id');
  }

  try {
    /* findByIdAndUpdate bypasses mongoose and does a direct operation on the database
    // Now for the document middleware to work, use mongoose methods to update records as follows - */
    // 1. Find the task
    const task = await Task.findOne({ _id, owner: req.user._id });

    if(!task) {
      return res.status(400).send();
    }

    // 2. Alter the task properties
    updates.forEach(update => { task[update] = req.body[update]; });

    // 3. Save the task
    await task.save();

    res.send(task);

  } catch (e) {
    return res.status(400).send(e);
  } 
});

router.delete('/tasks/deleteAll', auth, async (req, res) => {
  try {
    await Task.deleteMany({ owner: req.user._id });
    res.send('Tasks deleted successfully!');
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  if(!mongoose.isValidObjectId(_id)) {
    return res.status(400).send('Invalid task Id');
  }

  try {

    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
    console.log(task)

    if(!task || task.deletedCount === 0) {
      return res.status(404).send();
    }

    res.send(`Deleted Task: ${task}`)
    
  } catch (e) {
    res.status(500).send(e);
  }

});

module.exports = router;