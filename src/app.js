const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
const { encrypt } = require('./server/aes');

const app = express();
const connection = mysql.createConnection({
	host     : process.env.MYSQL_HOST || 'localhost',
	user     : process.env.MYSQL_USERNAME || 'root',
	password : process.env.MYSQL_PASSWORD || '',
	database : process.env.MYSQL_DATABASE || 'csc'
});

/**
 * Port for the express server to serve content on
 * @constant {number} port An integer value between 1024 and 49151
 * @see https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
 */
const port = process.env.EXPRESS_PORT || 3000;

/**
 * Port for the websocket to run on
 * @constant {number} wsport An integer value between 1024 and 49151
 * @see https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
*/
const wsport = process.env.WS_PORT || 8999;

// Routing for static files such as the css styling and three.js files
app.use(express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, '../node_modules/three')));
app.use('/docs', express.static(path.join(__dirname, '/docs')))

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

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

        if (message[0] === undefined) {
            return;
        }

        if (message[0] === 0) {

            ws.send(new Uint8Array([0]).buffer);

        } else if (message[0] === 1) {

            wss.broadcast({'message':message.slice(1,201),'client':ws.id}, 3)

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
 * @version 1.2
 * @example
 * generateID()
 * Returns "4536fd9da966c069"
 */
wss.generateID = function () {
    let dt = new Date().getTime();
    let uuid = '4xxxxxxxyxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = (dt + Math.random()*16)%16 | 0;
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
    let props = {
        title: 'Login'
    };
    if (req.session.loginerror) {
        props.loginerror = true;
        req.session.loginerror = undefined;
    } else if (req.session.accountcreated) {
        props.accountcreated = true;
        req.session.accountcreated = undefined;
    }
    res.render(path.join(__dirname, '/views/login'), props);
})

app.get('/register', (req, res) => {
    let props = {
        title: 'Register'
    };
    if (req.session.accountexists) {
        props.accountexists = true;
        req.session.accountexists = undefined;
    }
    res.render(path.join(__dirname, '/views/register'), props);
})

app.get('/logout', (req, res) => {
    if (req.session.loggedin) {
        req.session.destroy();
    }
    res.redirect('/login');
})

app.get('/game', (req, res) => {
    if (req.session.loggedin || process.env.NODE_ENV === 'development') { // Skip auth if in development mode
        res.render(path.join(__dirname, '/views/game'), {
            title: 'Game'
        });
    } else {
		res.redirect('/login');
	}
})

app.get('/shop', (req, res) => {
    res.render(path.join(__dirname, '/views/shop'), {
        title: 'Shop'
    });
})

app.get('/shell', (req, res) => {
    if (req.session.isAdmin || true) {
        res.render(path.join(__dirname, '/views/shell'), {
            title: 'Shell',
            session: req.session
        });
    } else {
        res.redirect('/403');
    }
})

app.get('/api/friends/:id', (req, res) => {
    connection.query('SELECT u.avatar, u.username, u.isOnline, f.accepted from friends f INNER JOIN users u ON u.id = f.friendid WHERE f.userid = ?', [req.params.id], function(error, results, fields) {
        if (error) throw error;
        res.json({'players':results});
        res.end();
    });
})

app.get('/api/updates/:page', (req, res) => {
    // Get the most recent updates
    // page defaults to 0 then 1 to get updates 6-10 etc.
    res.json({
        'updates': [
            {
                'added': 1627890529596,
                'title': 'Release Notes for 2/8/2021',
                'link': 'https://github.com/s3ansh33p/Computer-Science-ATAR/commit/83470e8cf54bd1b6ccc4c9210d2908e47ef2945b',
                'content': '**Markdown Content** \n - 1\n - 2\n Something like this'
            },
            {
                'added': 1627890529595,
                'title': 'Release Notes for 1/8/2021',
                'link': 'https://github.com/s3ansh33p/Computer-Science-ATAR/commit/83470e8cf54bd1b6ccc4c9210d2908e47ef2945b',
                'content': '**Markdown Content** \n - 1\n - 2\n Something like this'
            },
            {
                'added': 1627890529594,
                'title': 'Release Notes for 31/7/2021',
                'link': 'https://github.com/s3ansh33p/Computer-Science-ATAR/commit/83470e8cf54bd1b6ccc4c9210d2908e47ef2945b',
                'content': '**Markdown Content** \n - 1\n - 2\n Something like this'
            },
        ]
    });
    res.end();
})

app.post('/auth', function(req, res) {
	const email = req.body.email;
    const password = req.body.password;
	if (email && password) {
        const hash = encrypt(Buffer.from(password, 'utf8'));
		connection.query('SELECT * FROM users WHERE email = ? AND pass = ?', [email, hash], function(error, results, fields) {
            if (error) throw error;
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.email = email;
                req.session.username = results[0].username;
                req.session.avatar = results[0].avatar;
                req.session.registered = results[0].registered;
                req.session.curRank = results[0].curRank;
                req.session.userID = results[0].id;
                req.session.isAdmin = results[0].isAdmin;
				res.redirect('/home');
			} else {
                req.session.loginerror = true;
				res.redirect('/login');
			}			
			res.end();
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

app.post('/auth-register', function(req, res) {
	const username = req.body.username;
	const email = req.body.email;
    const password = req.body.password;
	if (username && email && password) {
		connection.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], function(error, results, fields) {
            if (results.length > 0) {
				req.session.accountexists = true;
				res.redirect('/register');
			    res.end();
			} else {
                const hash = encrypt(Buffer.from(password, 'utf8'));
                connection.query('INSERT INTO users (username, email, pass) VALUES (?, ?, ?)', [username, email, hash], function(error, results, fields) {
                    req.session.accountcreated = true;
                    res.redirect('/login');
			        res.end();
                });
			}			
		});
	} else {
		res.send('Please enter Username, Email and Password!');
		res.end();
	}
});

app.get('/home', function(req, res) {
	if (req.session.loggedin) {
            res.render(path.join(__dirname, '/views/ui'), {
            title: 'Home',
            ranks: ['Unranked (I)', 'Bronze (II)','Bronze (III)','Silver (IV)','Silver (V)','Gold (VI)','Gold (VII)','Platinum (VIII)','Platinum (IX)','Legend (X)','Max'],
            session: req.session
            // friends: [{
            //     'username': 'Decay',
            //     'avatar': 'https://i.guim.co.uk/img/media/1b484f728a7be02fd5684ffdd110b63b1875c898/0_137_2603_1562/master/2603.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=394e2a7cbf2a64189f2e4463b5a73050',
            //     'online': true
            // },{
            //     'username': 'dinrah',
            //     'avatar': 'https://i.guim.co.uk/img/media/1b484f728a7be02fd5684ffdd110b63b1875c898/0_137_2603_1562/master/2603.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=394e2a7cbf2a64189f2e4463b5a73050',
            //     'online': false
            // }]
        });
        res.end();
	} else {
        res.redirect('/login');
	}
	res.end();
});

app.get('/403', (req, res) => {
    res.status(403).render(path.join(__dirname, '/views/403'), {
        title: '403'
    });
});

// Add a 404 route
app.get('*', (req, res) => {
    res.status(404).render(path.join(__dirname, '/views/404'), {
        title: '404'
    });
});

// Start the Express Server
app.listen(port, () => {
  console.log(`Listening at localhost:${port}`)
})
