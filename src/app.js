const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const app = express();

/**
 * Port for the express server to serve content on
 * @constant {number} port An integer value between 1024 and 49151
 * @see https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
 */
const port = 3000;

/**
 * Port for the websocket to run on
 * @constant {number} wsport An integer value between 1024 and 49151
 * @see https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
*/
const wsport = 8999;

// Routing for static files such as the css styling and three.js files
app.use(express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, '../node_modules/three')));
app.use('/docs', express.static(path.join(__dirname, '/docs')))

app.set('view engine', 'ejs');

// Web Socket and Initialization
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

/**
 * @name ws
 * @property {string}  ws.id                  - The client's socket id
 * @property {object}  ws.playerData          - The client's player data for rendering
 * @property {number}  ws.playerData.x        - The client's x camera position in the scene
 * @property {number}  ws.playerData.y        - The client's y camera position in the scene
 * @property {number}  ws.playerData.z        - The client's z camera position in the scene
 * @property {number}  ws.playerData.rotation - The client's camera rotation in the scene
 * @property {boolean} ws.playerData.hasFlag  - If the client has the enemy flag
 * @property {object}  ws.userData            - The client's user information
 * @property {string}  ws.userData.username   - The client's username
 * @property {boolean} ws.userData.team       - The client's team
 */
wss.on('connection', (ws) => {

    ws.id = wss.generateID();

    ws.playerData = {
        'x':0,
        'y':0,
        'z':0,
        'rotation': 0,
        'hasFlag': false
    }

    ws.userData = {
        'username': '',
        'team': (Math.round(Math.random(0,1)) == 1) ? true : false
    }

    // After the connection is up, listen for messages.
    ws.on('message', (message) => {

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

/**
 * Sends a message to all websocket connections
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {Object} msg The JSON data to send
 * @param   {Object} type [type="Broadcast"] The type of the message to help the client interpret the message 
 * @returns {void}
 * @version 1.0
 * @example
 * broadcast({
 *  'message': "Hello World",
 *  'client':  "f536-4d9d-a966-c069"
 *  },
 *  "chat"
 * )
 */
wss.broadcast = function broadcast(msg, type="broadcast") {

    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify({'data':msg,'type':type}));
     });

};

/**
 * Generate a unique user id
 * @author  https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
 * @returns {string} The UUID
 * @version 1.0
 * @example
 * generateID()
 * Returns "f536-4d9d-a966-c069"
 */
wss.generateID = function () {
    var dt = new Date().getTime();
    var uuid = 'xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

// Start the Websocket Server
server.listen(wsport, () => {
    console.log(`Server started on localhost:${server.address().port}`);
});

// Setup routes
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

app.get('/api/players/:id', (req, res) => {
    const players = mysqlGetPlayer(req.params.id);
    res.json({'players':players});
})

// Add a 404 route
app.get('*', (req, res) => {
    res.status(404).render(path.join(__dirname, '/views/404'), {
        title: '404'
    })
});

// Start the Express Server
app.listen(port, () => {
  console.log(`Listening at localhost:${port}`)
})

/**
 * Returns an object containing player information
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param {number} userid The user's id in the database
 * @returns {Object} Temporary data used for testing until a database is properly implemented
 * @version 1.0
 * @example
 * mysqlGetPlayer(1)
 * Returns {
 *  'id':         1,
 *  'name':       'admin',
 *  'registered': '28/06/21',
 *  'wins':       0,
 *  'losses':     0
*  }
 */
function mysqlGetPlayer(userid) {
    return {
        'id': userid,
        'name': 'admin',
        'registered': '28/06/21',
        'wins': 0,
        'losses': 0
    };
}