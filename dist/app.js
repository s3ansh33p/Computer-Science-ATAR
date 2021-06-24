const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const app = express();
const port = 3000;

// Routing for static files such as the css styling
app.use(express.static(__dirname + '/public'));

// Web Socket
const server = http.createServer(app);
// Initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.id = wss.generateID();

    // After the connection is up, listen for messages.
    ws.on('message', (message) => {

        // Log the received message and send it back to the client
        console.log('Received from '+ws.id+': %s', JSON.stringify(message));
        // wss.broadcast(`Hello, you sent -> ${message}`);
        if (JSON.parse(message).type == undefined) return;
        if (JSON.parse(message).type == 'ping') {
            ws.send(JSON.stringify({'type': 'pong'}));
        }
    });

    // Broadcast new users joining
    ws.send(JSON.stringify({'data':'Connected to the server','type':'connection'}));
    wss.broadcast(`UserID ${ws.id} joined the server`);
});

wss.broadcast = function broadcast(msg) {
    console.log(msg);
    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify({'data':msg,'type':'broadcast'}));
     });
};

 wss.generateID = function (){
    var dt = new Date().getTime();
    var uuid = 'xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
  }

//start our server
server.listen(8999, () => {
    console.log(`Server started on port ${server.address().port}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/index.html'));
})

app.all((req,res) => {
    res.send(`Req: ${req}`)
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})