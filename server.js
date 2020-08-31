const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
require('dotenv').config();
const mongoose = require('mongoose');

let users = [];
let messages = [];

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MONGODB connected!');
  })
  .catch((error) => console.log(error));

const ChatSchema = mongoose.Schema({
  username: String,
  msg: String,
});

const ChatModel = mongoose.model('chat', ChatSchema);

ChatModel.find((error, result) => {
  if (error) throw error;

  messages = result;
});

io.on('connection', (socket) => {
  socket.emit('loggedIn', {
    users: users.map((user) => user.username),
    messages: messages,
  });

  socket.on('newUser', (username) => {
    console.log(`${username} has entered the room`);
    socket.username = username;
    users.push(socket);

    io.emit('userOnline', socket.username);
  });

  socket.on('msg', (msg) => {
    let message = new ChatModel({
      username: socket.username,
      msg: msg,
    });

    message.save((error, result) => {
      console.log(result);
      if (error) throw error;

      messages.push(result);
      io.emit('msg', result);
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`${socket.username} has left the room`);
    io.emit('userLeft', socket.username);
    users.splice(users.indexOf(socket), 1);
  });
});

http.listen(process.env.PORT || 3000, () => console.log('server listening on port ', process.env.PORT || 3000));
