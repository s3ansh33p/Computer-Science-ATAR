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
        'rotation': 0
    }

    ws.userData = {
        'username': '',
        'team': (Math.round(Math.random(0,1)) === 1) ? true : false
    }

    // After the connection is up, listen for messages.
    ws.on('message', (message) => {

        message = new Uint8Array(message);
        console.log(message);

        if (message[0] === undefined) {
            return;
        }

        if (message[0] === 0) {

            ws.send(new Uint8Array([0]).buffer);

        } else if (message[0] === 1) {

            wss.broadcast({'message':message.slice(1),'client':ws.id}, 3)

        } else if (message[0] === 2) {

            ws.playerData = message.slice(1);
            wss.broadcast({'message':ws.playerData,'client':ws.id}, 4)

        } 

    });

    // Confirm that the client is connected and send them their client id
    ws.send(new Uint8Array([1, encodeClient(ws.id)].flat()).buffer);

    let activePlayers = [];
    
    wss.clients.forEach(function each(client) {
        activePlayers.push({'client':client.id,'username':client.userData.username, 'team':client.userData.team})
     });

    wss.broadcast(activePlayers, 2)
    // On active players, send positions?

});


/**
 * Encodes a client's id from hex to a byte array
 * @author  https://stackoverflow.com/users/1326803/jason-dreyzehner
 * @param   {string} id The client id in hex
 * @returns {number[]}
 * @version 1.0
 */
const encodeClient = (id) => {return id.match(/.{1,2}/g).map(byte => parseInt(byte, 16))}

/**
 * Sends a message to all websocket connections
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {Object} msg The JSON data to send
 * @param   {number} type The type of the message to help the client interpret the message 2,3,4
 * @returns {void}
 * @version 1.0
 * @example
 * broadcast({
 *  'message': "Hello World",
 *  'client':  "f5364d9da966c069"
 *  },
 *  3
 * )
 */
wss.broadcast = function broadcast(msg, type) {

    let byteData = [type];

    if (type === 2) {

        byteData.push(msg.length); // Number of players

        for (let i=0; i<msg.length; i++) {
            byteData.push(encodeClient(msg[i].client));
            byteData.push(msg[i].team);
        }

    } else {

        byteData.push(encodeClient(msg.client));
        byteData.push(Array.from(msg.message));
    
    }
    
    wss.clients.forEach(function each(client) {
        client.send(new Uint8Array(byteData.flat()).buffer);
     });

};

/**
 * Generate a unique user id
 * @author  https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
 * @returns {string} The UUID
 * @version 1.1
 * @example
 * generateID()
 * Returns "4536fd9da966c069"
 */
wss.generateID = function () {
    var dt = new Date().getTime();
    var uuid = '4xxxxxxxyxxxxxxx'.replace(/[xy]/g, function(c) {
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