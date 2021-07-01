const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const app = express();
const port = 3000;
const wsport = 8999;

// Routing for static files such as the css styling
app.use(express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, '../node_modules/three')));
app.set('view engine', 'ejs');

// Web Socket
const server = http.createServer(app);
// Initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.id = wss.generateID();
    ws.playerData = {
        'x':0,
        'y':0,
        'z':0,
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
server.listen(wsport, () => {
    console.log(`Server started on localhost:${server.address().port}`);
});

app.get('/', (req, res) => {
    res.render(path.join(__dirname, '/views/index'), {
        title: 'Home'
    });
})

app.get('/login', (req, res) => {
    res.render(path.join(__dirname, '/views/login'), {
        title: 'Login'
    });
})

app.get('/game', (req, res) => {
    res.render(path.join(__dirname, '/views/game'), {
        title: 'Game'
    });
})

app.get('/shop', (req, res) => {
    res.render(path.join(__dirname, '/views/shop'), {
        title: 'Shop'
    });
})

app.get('/api/players', (req, res) => {
    const players = mysqlGetPlayers();
    res.json({'players':players});
})


//The 404 Route
app.get('*', (req, res) => {
    res.status(404).render(path.join(__dirname, '/views/404'), {
        title: '404'
    })
});

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