const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
const { encrypt } = require('./server/aes');
const { exec } = require("child_process");
const Logger = require('./Logger');

const app = express();
const connection = mysql.createConnection({
	host     : process.env.MYSQL_HOST || 'localhost',
	user     : process.env.MYSQL_USERNAME || 'root',
	password : process.env.MYSQL_PASSWORD || '',
	database : process.env.MYSQL_DATABASE || 'csc',
    port: process.env.MYSQL_PORT || 3306
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

/**
 * URL prefix for requests
 * @constant {string} runtime Determines the correct URL for requests to be sent to
 */
const runtime = (process.env.NODE_ENV === 'development') ? 'http://127.0.0.1:'+port : 'https://dev.seanmcginty.space';

/**
 * Holds the game time remaining
 * @type {number}
 */
let gameTime = 0;
 /**
 * Holds the max game time
 * @constant {number}
 */
const maxGameTime = 60;
/**
 * Holds the game time interval
 * @type {Function}
 */
let gameTimers;


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
 * @property {string}  ws.id                  - The client's socket id or clientID
 * @property {object}  ws.gameData            - The client's game information
 * @property {number}  ws.gameData.kills      - The client's kills
 * @property {number}  ws.gameData.assists    - The client's assists
 * @property {number}  ws.gameData.deaths     - The client's deaths
 * @property {number}  ws.gameData.health     - The client's health points
 * @property {string}  ws.gameData.assistor   - The client's most recent source of damage for assist calculation
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

    ws.cooldown = false;

    ws.gameData = {
        'kills':0,
        'assists':0,
        'deaths':0, 
        'health': 100,
        'assistor': ""
    }

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
            Logger.error(`Recieved malformed packet from client "${ws.id}"`);
            return;
        }

        if (message[0] === 0) {

            // Logger.game(`Recieved ping from client "${ws.id}"`);
            ws.send(new Uint8Array([0]).buffer);

        } else if (message[0] === 1) {

            // Logger.game(`Recieved message from client "${ws.id}" | ${message.slice(1,201)}`);
            wss.broadcast({'message':message.slice(1,201),'client':ws.id}, 3)

        } else if (message[0] === 2 && gameTimers) {

            // Logger.game(`Recieved playerUpdate from client "${ws.id}" | ${message.slice(1)}`);
            ws.playerData = message.slice(1);
            wss.broadcast({'message':ws.playerData,'client':ws.id}, 4)

        } else if (message[0] === 3) {

            // Logger.game(`Recieved authentication from client "${ws.id}" | ${message.slice(1)}`);
            let authcode = decodeClient(message.slice(1,5));
            if (authcode === '12345678') {
                ws.userID = parseInt(decodeClient(message.slice(5)));
                
                // connection.query('SELECT username FROM users WHERE id = ?', [ws.userID], function(error, results, fields) {
                //     if (error) throw error;
                //     if (results.length > 0) {
                //         ws.userData.username = results[0].username;
                //     }
                // });
                ws.userData.username = 'TMP';

            } else {
                Logger.error(`Recieved invalid authentication from client "${ws.id}" | ${message.slice(1,5)}`);
            }

        } else if (message[0] === 4 && gameTimers) {
            Logger.game(`Recieved damageEvent from client "${ws.id}" | ${message.slice(1)}`);
            let targetClient = decodeClient(Array.from(message.slice(1,9)))
            wss.clients.forEach(function each(client) {
                if (client.id === targetClient) {
                    if (!client.cooldown) {
                        client.gameData.health -= 20;
                        client.gameData.assistor = ws.id
                    }
                    if (client.gameData.health <= 0) {
                        // Check if a previous client dealt damage for assist bonus
                        if (client.gameData.assistor != ws.id && client.gameData.assistor.length !== 0) {
                            ws.gameData.assists++;
                        }
                        // Update kills and deaths for attacker and victim clients
                        ws.gameData.kills++;
                        client.gameData.deaths++;
                        wss.broadcast({'killer': encodeClient(ws.id), 'client':targetClient}, 8);
                        client.gameData.health = 100;
                        client.cooldown = true;
                        setTimeout(() => {
                            client.cooldown = false;
                        }, 3000);
                    } else {
                        wss.broadcast({'message':[client.gameData.health, message.slice(9)],'client':Array.from(message.slice(1,9))}, 6);
                    }
                }
            });
        } else if (message[0] === 6) {
            Logger.game(`Recieved ms from client "${ws.id}" | ${message.slice(1)}`)
            wss.broadcast({'message':message.slice(1),'client':ws.id}, 7);
        }

    });

    if (!gamerTimers && gameTime === 0) {
        Logger.game("Creating new game");
        gameTime = maxGameTime;
        if (!gameTimers) {
            gameTimers = setInterval(() => {
                gameTime--;
                if (gameTime === 0) {
                    clearInterval(gameTimers);
                    gameTimers = undefined;
                    // Save the game data
                    endGame()
                }
            }, 1000); // Timer 1s
        }
    }

    // Confirm that the client is connected and send them their client id and game time
    ws.send(new Uint8Array([1, encodeClient(ws.id), encodeClient(gameTime.toString())].flat()).buffer);

    let activePlayers = [];
    
    wss.clients.forEach(function each(client) {
        activePlayers.push({'client':client.id,'username':client.userData.username, 'team':client.userData.team})
     });

    wss.broadcast(activePlayers, 2)
    // On active players, send positions?

});

/**
 * Saves game data and is called at the end of a game
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 */
function endGame() {
    Logger.game("Game ended");
    wss.clients.forEach(function each(client) {
        Logger.game(`Results for ${client.id} | Kills: ${client.gameData.kills} | Assists: ${client.gameData.assists} | Deaths: ${client.gameData.deaths} | Playing for ${client.userData.team ? 'Counter-Terrorists' : 'Terrorists'}`);
    });            
}

/**
 * Encodes a client's id from hex to a byte array
 * @author  https://stackoverflow.com/users/1326803/jason-dreyzehner
 * @param   {string} id The client id in hex
 * @returns {number[]}
 * @version 1.0
 */
const encodeClient = (id) => {return id.match(/.{1,2}/g).map(byte => parseInt(byte, 16))}

/**
 * Decodes a client's id from a byte array to hex
 * @author  https://stackoverflow.com/users/1326803/jason-dreyzehner
 * @param   {number[]} id The client id in array byte form
 * @returns {string}
 * @version 1.0
 */
 const decodeClient = (id) => {return id.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')}

/**
 * Sends a message to all websocket connections
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {Object} msg The JSON data to send
 * @param   {number} type The type of the message to help the client interpret the message 2,3,4
 * @returns {void}
 * @version 1.0
 * @example
 * broadcast({
 *  'message': Array.from(new TextEncoder().encode("Hello World")),
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

    } else if (type === 6) {
        
        byteData.push(msg.client);
        byteData.push(msg.message);

    } else if (type === 7) {
    
        byteData.push(encodeClient(msg.client));
        byteData.push(msg.message);

    } else if (type === 8) {
    
        byteData.push(msg.client);
        byteData.push(msg.killer);

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
    Logger.info(`Server started on localhost:${server.address().port}`);
});

// Setup routes
app.get('/', (req, res) => {
    res.render(path.join(__dirname, '/views/index'), {
        title: 'Home',
        session: req.session
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
            title: 'Game',
            session: req.session
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
    if (req.session.isAdmin || process.env.NODE_ENV === 'development') {
        res.render(path.join(__dirname, '/views/shell'), {
            title: 'Shell',
            session: req.session,
            type: runtime
        });
    } else {
        res.redirect('/403');
    }
})

app.post('/shell/chat', async function(req, res) {
    if (req.session.isAdmin || process.env.NODE_ENV === 'development') {
        let message = req.body.message;
        if (message) {
            wss.broadcast({
                'message': Array.from(new TextEncoder().encode(message)),
                'client':  "1000000000000000"
            },3)
            res.send('Sent message');
        } else {
            res.send('No message contents');
        }
    } else {
        res.redirect('/403');
    }
})

app.post('/shell/data', async function(req, res) {
    if (req.session.isAdmin || process.env.NODE_ENV === 'development') {
        let message = req.body.message;
        if (message) {
            let result = [];
            wss.clients.forEach(function each(client) {
                result.push({'client':client.id, 'playerData':client.playerData, 'userData':client.userData});
             });
            res.send(JSON.stringify(result));
        } else {
            res.send('No message contents');
        }
    } else {
        res.redirect('/403');
    }
})

app.post('/shell/sudo', async function(req, res) {
    if (req.session.isAdmin || process.env.NODE_ENV === 'development') {

        function runCommand(command) {
            return new Promise(function(resolve, reject) {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        resolve(JSON.stringify(error));
                        return;
                    }
                    if (stderr) {
                        resolve(JSON.stringify(stderr));
                        return;
                    }
                    resolve(stdout);
                    return;
                });
            });
        }

        let command = req.body.command;
        if (command) {
            let result = await runCommand(command);
            Logger.shell(`Shell: ${command} | ${result}`);
            res.send(result);
        }
    } else {
        res.redirect('/403');
    }
})

app.post('/shell/mysql', async function(req, res) {
    if (req.session.isAdmin || process.env.NODE_ENV === 'development') {
        if (req.body.command) {
            Logger.mysql(`Executed SQL: ${req.body.command}`);
            connection.query(req.body.command, function(error, results, fields) {
                if (error) res.json(error);
                res.json(results);
            });
        } else {
            res.json({
                'error': 'No query in request'
            });
        }
    } else {
        Logger.error(`Attempted to execute SQL: ${req.body.command}`);
        res.redirect('/403');
    }
})

app.get('/api/friends/:id', (req, res) => {
    Logger.API(`Retreiving friends for ID: ${req.params.id}`);
    connection.query('SELECT u.avatar, u.username, u.isOnline, f.accepted from friends f INNER JOIN users u ON u.id = f.friendid WHERE f.userid = ? ORDER BY u.isOnline DESC', [req.params.id], function(error, results, fields) {
        if (error) throw error;
        res.json({'players':results});
        res.end();
    });
})

app.get('/api/games/:id', (req, res) => {
    Logger.API(`Retreiving friends for ID: ${req.params.id}`);
    connection.query('SELECT u.id, u.username, u.curRank, r.kills, r.assists, r.deaths, g.startTime, g.duration, g.mode, g.map, g.winner FROM results r INNER JOIN users u ON r.userid = u.id INNER JOIN games g ON r.gameid = g.id WHERE r.gameid = ?', [req.params.id], function(error, results, fields) {
        if (error) throw error;
            if (results.length > 0) {
            let json = {
                'map': results[0].map,
                'mode': results[0].mode,
                'startTime': results[0].startTime,
                'duration': results[0].duration,
                'winner': results[0].winner,
                'players': []
            };
            for (let i=0;i<results.length; i++) {
                json.players.push({
                    'id': results[i].id,
                    'username': results[i].username,
                    'curRank': results[i].curRank,
                    'kills': results[i].kills,
                    'assists': results[i].assists,
                    'deaths': results[i].deaths
                });
            }
            res.json(json);
        } else {
            res.json({
                'error': 'No records found'
            });
        }

        res.end();
    });
})

app.get('/api/stats', (req, res) => {
    Logger.API(`Retreiving user stats`);
    connection.query('SELECT COUNT(isOnline) AS userCount, COUNT(CASE WHEN isOnline = true THEN 1 END) AS onlineCount FROM users;', function(error, results, fields) {
        results = results[0];
        if (error) throw error;
        res.json(results);
        res.end();
    });
})


app.get('/api/updates/:page', (req, res) => {
    Logger.API(`Retreiving updates for ID: ${req.params.id}`);
    // Get the most recent updates
    // page defaults to 0 then 1 to get updates 6-10 etc.
    connection.query('SELECT u.avatar, u.username, u.isOnline, f.accepted from friends f INNER JOIN users u ON u.id = f.friendid WHERE f.userid = ? ORDER BY u.isOnline DESC', [req.params.id], function(error, results, fields) {
        if (error) throw error;
        res.json({results});
        res.end();
    });
    res.end();
})

app.post('/auth', function(req, res) {
	const email = req.body.email;
    const password = req.body.password;
	if (email && password) {
        const hash = encrypt(Buffer.from(password, 'utf8'));
		connection.query('SELECT id, username, email, avatar, registered, curRank, isAdmin, isOnline FROM users WHERE email = ? AND pass = ?', [email, hash], function(error, results, fields) {
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
                // Get games
                connection.query('SELECT COUNT(r.userid) AS gameCount from results r WHERE r.userid = ?', [req.session.userID], function(error, results, fields) {
                    if (error) throw error;
                    req.session.gameCount = results[0].gameCount.toString();
                    res.redirect('/home');
                });
			} else {
                req.session.loginerror = true;
				res.redirect('/login');
			}			
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
            if (error) throw error;
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
            title: 'Play',
            type: runtime,
            ranks: ['Unranked (I)', 'Bronze (II)','Bronze (III)','Silver (IV)','Silver (V)','Gold (VI)','Gold (VII)','Platinum (VIII)','Platinum (IX)','Legend (X)','Max'],
            session: req.session
        });
	} else {
        res.redirect('/login');
	}
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
  Logger.info(`Listening at localhost:${port}`)
})
