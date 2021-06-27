const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { active } = require('browser-sync');
const app = express();
const port = 3000;

// Routing for static files such as the css styling
app.use(express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, '../node_modules/three')));

// Web Socket
const server = http.createServer(app);
// Initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.id = wss.generateID();
    ws.playerData = {
        'x':10,
        'y':5,
        'z':23,
        'rotation': 0,
        'hasFlag':false
    }
    ws.userData = {
        'username': '',
        'team': Math.round(Math.random(0,1)) // Returns a '0' or '1' to determine the default team -> Todo, change this to autobalance teams.
    }

    // After the connection is up, listen for messages.
    ws.on('message', (message) => {

        // Log the received message and send it back to the client
        // console.log('Received from '+ws.id+': %s', JSON.stringify(message));
        // wss.broadcast(`Hello, you sent -> ${message}`);
        if (JSON.parse(message).type == undefined) return;
        if (JSON.parse(message).type == 'ping') {
            ws.send(JSON.stringify({'type': 'pong'}));
        } else if (JSON.parse(message).type == 'playerUpdate') {
            ws.playerData = JSON.parse(message).data;
            wss.broadcast({'playerData':JSON.parse(message).data,'client':ws.id})
        } else if (JSON.parse(message).type == 'chatMessage') {
            wss.broadcast({'message':JSON.parse(message).data,'client':ws.id}, "chat")
        } 
    });

    // Broadcast new users joining
    ws.send(JSON.stringify({'data':ws.id,'type':'connection'}));
    let activePlayers = [];
    wss.clients.forEach(function each(client) {
        activePlayers.push({'client':client.id,'username':client.userData.username, 'team':client.userData.team})
     });
    wss.broadcast(activePlayers, "activePlayers")
    // On active players, send positions?
});

wss.broadcast = function broadcast(msg, type="broadcast") {
    // console.log(msg);
    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify({'data':msg,'type':type}));
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
    console.log(`Server started on localhost:${server.address().port}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/index.html'));
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/login.html'));
})

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/game.html'));
})

app.get('/api/players', (req, res) => {
    const players = mysqlGetPlayers();
    res.json({'players':players});
})


app.all((req,res) => {
    res.send(`Req: ${req}`)
})

app.listen(port, () => {
  console.log(`Listening at localhost:${port}`)
})

function mysqlGetPlayers() {
    return {
        'id': 1,
        'name': 'admin',
        'registered': '28/06/21',
        'wins': 0,
        'losses': 0
    };
}