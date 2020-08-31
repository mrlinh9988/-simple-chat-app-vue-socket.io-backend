const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let users = [];
let messages = [];
let index = 0;

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
    let message = {
      index,
      username: socket.username,
      msg: msg,
    };

    messages.push(message);

    io.emit('msg', message);

    index++;
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`${socket.username} has left the room`);
    io.emit('userLeft', socket.username);
    users.splice(users.indexOf(socket), 1);
  });
});

http.listen(process.env.PORT || 3000, () => console.log('server listening on port ', process.env.PORT || 3000));
