/*
    server.js
    main server script for the socket.io chat demo
*/

'use strict';

//require modules we need
var net = require('net');       //network socket module

//create a new socket server
var server = net.createServer();

//array of all connected clients
var clients = [];

//when the server gets a new connection...
server.on('connection', function(socket) {

    //helper function to broadcast a message to all other clients
    function broadcast(name, message) {
        clients.forEach(function(client) {
            //don't send to self
            if (client !== socket) {
                client.write('[' + name + '] ' + message + '\n');
            }
        });
    } //broadcast()

    //set the string encoding to UTF-8 so we get UTF-8 string
    socket.setEncoding('utf8');

    //push this socket into our array of connected clients
    clients.push(socket);

    console.log('new connection');
    console.log('%d client(s)', clients.length);

    //buffer for incoming messages
    //because network servers receive incoming data in chunks, we
    //need to buffer up the data we receive until we see the end of
    //a complete 'message', which in our case is indicated by a newline
    //in the input (\n)
    var buffer = '';

    //variable to hold the current client's name
    var name;

    //start by welcoming and asking for a name
    socket.write("Hi, what's your name?\n");

    //when the socket receives data...
    socket.on('data', function(data) {
        //append to the message string
        buffer += data;

        //is there a newline in the data?
        var idx = buffer.indexOf('\n');
        if (idx >= 0) {
            //extract message (omit newline)
            //but leave anything past the newline in the buffer
            var message = buffer.substring(0, idx - 1);
            buffer = buffer.substring(idx + 1);

            //truncate message to 140 chars ('cause we wish we were twitter)
            message = message.substr(0, 140);

            //emit a 'message' event on the socket
            //passing the full message as the data
            socket.emit('message', message);
        } //newline in buffer
    }); //data event

    //when the socket receives a complete message...
    socket.on('message', function(message) {
        if (0 === message.length) {
            socket.write('(type something and hit return)\n');
            return;
        }

        //if we haven't captured the name yet, treat this as the name
        if (!name) {
            //truncate name to 10 characters, just to be safe
            name = message.substr(0, 10);

            //respond with a friendly greeting
            socket.write('Hello ' + name + '!\n');
            socket.write('Welcome to the chat room, ' + name + '!\n');
            socket.write('There are ' + clients.length + ' people here.\n');
            socket.write("Type messages, or type 'exit' at any time to leave.\n");
        }
        else {
            //if message is exactly 'exit' then close the connection
            if ('exit' === message) {
                socket.end();
            }
            else {
                //broadcast the message to all other clients
                broadcast(name, message);
            }
        }
    }); //message event

    //when the socket is closed...
    socket.on('close', function() {
        //remove from the clients array
        clients = clients.filter(function(s) {
            return s != socket;
        });

        //let everyone know that the client has left
        broadcast('system', name + ' has left the building');
        broadcast('system', 'there are now ' + clients.length + ' people left in the room');

        console.log('connection closed');
        console.log('%d client(s)', clients.length);
    }); //close event

});

//when the server starts listening...
server.on('listening', function() {
    //output to the console the port number on which we are listening
    var addr = server.address();
    console.log('server listening on port %d', addr.port);
});

//start the server
server.listen(3000);
