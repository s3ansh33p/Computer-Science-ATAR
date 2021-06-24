const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const app = express()
const port = 3000

app.use(express.static(__dirname + '/public'));

// Web Socket
const server = http.createServer(app);
//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {

    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {

        //log the received message and send it back to the client
        console.log('received: %s', message);
        ws.send(`Hello, you sent -> ${message}`);
    });

    //send immediatly a feedback to the incoming connection    
    ws.send('Hi there, I am a WebSocket server');
});

//start our server
server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port ${server.address().port}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/index.html'));
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})