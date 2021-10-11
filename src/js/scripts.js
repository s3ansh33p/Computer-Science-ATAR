window.globalHandler = window.globalHandler || {};

/**
 * A websocket connection to the server for networking
 * @constant
 * @type {WebSocket}
 */
const server = new WebSocket("ws://localhost:8999");
// const server = new WebSocket("wss://socket.seanmcginty.space");

// Ensure that the messages transfered via the websocket are buffers
server.binaryType = 'arraybuffer';

/**
 * Sends a JSON object to the server via a websocket
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {Object} data JSON object usually with data and type
 * @returns {void}
 * @version 1.2
 * @example
 * sendData({
 *  'data': {
 *           'x':        10,
 *           'y':        5,
 *           'z':        23,
 *           'rotation': 0
 *  },
 *  'type': 'playerUpdate'
 * })
 */
function sendData(data) {

    /**
     * An array to store data to send to the server
     * @type {number[]}
     */
    let byteData = [];

    /**
     * An array to map JSON typings to byte values for networking
     * @constant
     * @type {string[]}
     */
    const typings = [ "PING", "CHATMESSAGE" , "PLAYERUPDATE" , "AUTH", "DAMAGE", "KICK", "MS" ];

    if (typings.indexOf(data.type.toUpperCase()) === -1) {

        globalHandler.log(`Malformed data: ${JSON.stringify(data)}`, "Network")
        return;

    } else {

        byteData[0] = typings.indexOf(data.type.toUpperCase());

    }

    if (byteData[0] === 1) {

        byteData.push(Array.from(new TextEncoder().encode(data.data)));
        if (byteData.length > 200) byteData = byteData.slice(0,200); // Prevent sending huge amounts of data - need to implement a cooldown feature too

    } else if (byteData[0] === 2) {

        byteData.push([
            parseInt(((data.data.x >= 0) ? 100 : 200) + Math.abs(data.data.x)), // add 200 or 100 if =/-
            parseInt(1+(Math.abs(data.data.x) % 1).toFixed(2).slice(2)), // as 0.3 is actually 0.2999999, 1+ as 0.01 = 1 but should be 01
            parseInt(((data.data.y >= 0) ? 100 : 200) + Math.abs(data.data.y)),
            parseInt(1+(Math.abs(data.data.y) % 1).toFixed(2).slice(2)),
            parseInt(((data.data.z >= 0) ? 100 : 200) + Math.abs(data.data.z)),
            parseInt(1+(Math.abs(data.data.z) % 1).toFixed(2).slice(2)),
            ((data.data.rotation >= 0) ? 0 : 1),
            (Math.abs(data.data.rotation))
        ]);

    } else if (byteData[0] === 3) {

        byteData.push(encodeHex(data.data.code.toString()));
        byteData.push(data.data.userid);

    } else if (byteData[0] === 4) {

        byteData.push(encodeHex(data.data.clientID));
        byteData.push(1); // Mesh Name -> 1 headshot

    } else if (byteData[0] === 6) {

        byteData.push(data.data.ms);

    }

    // Finally, send the data to the server
    server.send(new Uint8Array(byteData.flat()).buffer);

}

/**
 * Encodes hex to a byte array
 * @author  https://stackoverflow.com/users/1326803/jason-dreyzehner
 * @param   {string} hex The hex value
 * @returns {number[]}
 * @version 1.0
 */
 const encodeHex = (hex) => {return hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))}

/**
 * The client's ping
 * @type {number}
 */
let clientMS = 0;

 /**
 * The players client id used or networking
 * @type {string}
 */
let clientID = '';

 /**
 * Tracks if the client is 'dead'
 * @type {bool}
 */
let isDead = false;

/**
 * An array of other players (does not include the player)
 * @name otherPlayers
 * @type {Object[]}
 * @property {Object}  otherPlayers[index]          - Another player's data
 * @property {number}  otherPlayers[index].x        - Another player's x camera position in the scene
 * @property {number}  otherPlayers[index].y        - Another player's y camera position in the scene
 * @property {number}  otherPlayers[index].z        - Another player's z camera position in the scene
 * @property {number}  otherPlayers[index].rotation - Another player's camera rotation in the scene
 * @property {string}  otherPlayers[index].client   - Another player's client id
 * @property {string}  otherPlayers[index].client   - Another player's username
 */
let otherPlayers = [];

/**
 * If the player has the chat active or not
 * @type {boolean}
 */
let typing = false;

/**
 * If the player is connected to the server
 * @type {boolean}
 */
let connectedToServer = false; // Potentially store this and status info in one variable. Like status = 1 | 2 | 3 ... 'connected', 'ingame', 'disconnected' etc

/**
 * If the player is in a game
 * @type {boolean}
 */
let inGame = false;

/**
 * Holds the timers to measure difference of time between the code
 * @type {number[]}
 */
var timers = {};

/**
 * Creates a timer
 * @author  https://stackoverflow.com/users/4122553/felix
 * @param   {string} name The name of the timer
 * @return  {void}
 * @version 1.0
 * @example
 * timer("connectionMS")
 */
function timer(name) {
    timers[name + '_start'] = window.performance.now();
}

/**
 * Returns the number of miliseconds elapsed since a timer was started
 * @author  https://stackoverflow.com/users/4122553/felix
 * @param   {string} name The name of the timer
 * @returns {number} Number of miliseconds since timer started
 * @version 1.0
 * @example
 * timerEnd("connectionMS")
 * Returns 32.70000000298
 */
function timerEnd(name) {
    if (!timers[name + '_start']) return undefined;
    var time = window.performance.now() - timers[name + '_start'];
    var amount = timers[name + '_amount'] = timers[name + '_amount'] ? timers[name + '_amount'] + 1 : 1;
    var sum = timers[name + '_sum'] = timers[name + '_sum'] ? timers[name + '_sum'] + time : time;
    timers[name + '_avg'] = sum / amount;
    delete timers[name + '_start'];
    return time;
}

// Start the timer 'connectionMS'
timer('connectionMS');

/**
 * Callback function that is called when the client receives a message from the server
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {Object} event The message contents
 * @returns {void}
 * @version 1.1
 */
server.onmessage = function (event) {

    const Uint8View = new Uint8Array(event.data);

    let decodedClient;

    switch(Uint8View[0]) {

        case 0:

            pong();
            break;

        case 1:

            connectedToServer = true;
            clientID = decodeClient(Uint8View.slice(1,9));

            const conMS = Math.round(timerEnd('connectionMS'));
            document.getElementsByClassName('loading-text')[0].innerHTML = `<p>Connected to server in ${conMS}ms</p>`;
            console.log(`%c[Network]%c Connected to server in ${conMS}ms`,"color: #fff000;","");

            let gameTimeTmp = decodeClient(Uint8View.slice(9)).toString();
            // console.log(gameTimeTmp)
            gameTime = parseInt(gameTimeTmp.slice(0,2) + gameTimeTmp.slice(3,4))
            console.log(`%c[Network]%c Synced Server Game Time: ${getGameLength(gameTime)}`,"color: #fff000;","");

            if (!gameTimers) {
                gameTimers = setInterval(() => {
                    updateGameTimers();
                }, 1000); // Timer
            }        

            sendData({
                'data': {
                         'code': 12345678, // Todo: add auth generation and server side validation
                         'userid': userid // Defined in game.ejs from session
                },
                'type': 'auth'
            })

            sendData({
                'data': {
                         'ms': encodeHex(conMS.toString()),
                },
                'type': 'ms'
            })

            break;

        case 2:

            otherPlayers = []; // Defined in game.js

            document.getElementsByClassName('tab-players')[0].innerHTML = '';
            document.getElementsByClassName('tab-players')[1].innerHTML = '';

            // T , CT
            let totalTeams = [0,0];
            
            for (let i = 0; i < Uint8View[1]; i++) {
                
                decodedClient = decodeClient( Uint8View.slice( 2+i*9 , 10+i*9 ) );
                
                const team = (Uint8View.slice(10+i*9,11+i*9)[0] === 0 ? 'T' : 'CT');
                totalTeams[(team === "T") ? 0 : 1]++;
                if ( decodedClient !== clientID) {

                    otherPlayers.push({ 
                        'x':0,
                        'y':0,
                        'z':0,
                        'rotation': 0,
                        'client': decodedClient,
                        'team': team,
                        'username': 'Loading...',
                        'ms': 0
                    })
                } else {
                    function loaded() {
                        globalHandler.playerData.team = team;
                        globalHandler.log('All critical data loaded successfully');
                        let curSettings = getSettings();
                        if (curSettings.rendering.frameLimit < 30) globalHandler.log(`Low frame limit can lead to collision issues. Found value ${curSettings.rendering.frameLimit}`, "System")
                        if (curSettings.rendering.fxaa) {
                            globalHandler.log(`Enabling FXAA can lead to poor performance on weak hardware.`, "System")
                            if (curSettings.rendering.sampling > 3) globalHandler.log(`Setting FXAA sampling above 3 hugely impacts performance. Found value ${curSettings.rendering.sampling}`, "System")
                        }
                        let raw = 'Client Settings\n';
                        let props = Object.getOwnPropertyNames(curSettings);
                        for (let i=0; i<props.length; i++) {
                            raw += `${props[i].toUpperCase()}\n`;
                            let subProps = Object.getOwnPropertyNames(curSettings[props[i]]);
                            for (let j=0;j<subProps.length; j++) {
                                if (typeof curSettings[props[i]][subProps[j]] == "object") {
                                    raw += `  ${subProps[j]}:\n`;
                                    let subSubProps = Object.getOwnPropertyNames(curSettings[props[i]][subProps[j]]);
                                    for (let k=0; k<subSubProps.length; k++) {
                                        raw += `     ${subSubProps[k]}: ${curSettings[props[i]][subProps[j]][subSubProps[k]]}\n`;
                                    }
                                } else {
                                    raw += `  ${subProps[j]}: ${curSettings[props[i]][subProps[j]]}\n`;
                                }
                            }
                        }
                        globalHandler.log(raw);
                    }
                    if (globalHandler.playerData === undefined) {
                        let callbackCount = 0;
                        let callback = setInterval(() => {
                            callbackCount++;
                            if (callbackCount > 100) {
                                clearInterval(callback);
                                console.log(`%c[CRITICAL ERROR]%c TIMED OUT`,"color: #ff0000;","");
                                return;
                            }
                            console.log(`%c[System]%c Waiting for all critical checks x${callbackCount}`,"color: #fff000;","");
                            if (globalHandler.playerData !== undefined) {
                                clearInterval(callback)
                                loaded();
                            }
                        }, 100);
                    } else {
                        loaded();
                    }
                }
                const innerHMTL = `	<tr id="client-${decodedClient}">
                <td>0</td>
                <td>
                    <span id="client-${decodedClient}-id">${(decodedClient === clientID) ? `${username} (you)` : 'Loading...'}</span>
                </td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
            </tr>
            <tr class="spacer"></tr>`;
            document.getElementsByClassName('tab-players')[(team === "T") ? 1 : 0].innerHTML += innerHMTL;
            }
            // console.log(totalTeams)
            document.getElementsByClassName('tb-1')[0].children[2].innerText = `Alive: ${totalTeams[1]}/${totalTeams[1]}`;
            document.getElementsByClassName('tb-1')[1].children[2].innerText = `Alive: ${totalTeams[0]}/${totalTeams[0]}`;

            if (clientMS !== 0) {
                sendData({
                    'data': {
                             'ms': encodeHex(clientMS.toString()),
                    },
                    'type': 'ms'
                })
            }

            break;

        case 3:

            const chatContainer = document.getElementById('chat-msg-container');

            let serverMsg = (decodeClient(Uint8Array.from(Uint8View.slice(1,9))) === '1000000000000000');

            chatContainer.innerHTML = `<div class="chat-wrapper"><div class="chat-msg"><span${serverMsg ? ' style="color: #f00"' : ''}>${serverMsg ? '[SERVER]' : lookupID(decodeClient(Uint8Array.from(Uint8View.slice(1,9))))}: </span>${new TextDecoder("utf-8").decode(Uint8View.slice(9))}</div></div>` + chatContainer.innerHTML;
            
            if (chatContainer.children.length > 20) {

                chatContainer.children[20].remove();

            }
            break;

        case 4:
            
            if (otherPlayers.length !== 0) {

                decodedClient = decodeClient( Uint8View.slice(1,9) );

                let index = otherPlayers.findIndex(obj => obj.client === decodedClient);

                if (index !== -1) { // checks if the player exists

                    otherPlayers[index].x = parseFloat( ((Uint8View[9].toString().slice(0,1) === "2") ? "-" : "" ) + Uint8View[9].toString().slice(1) + "." + Uint8View[10].toString().slice(1) );
                    otherPlayers[index].y = parseFloat( ((Uint8View[11].toString().slice(0,1) === "2") ? "-" : "" ) + Uint8View[11].toString().slice(1) + "." + Uint8View[12].toString().slice(1) );
                    otherPlayers[index].z = parseFloat( ((Uint8View[13].toString().slice(0,1) === "2") ? "-" : "" ) + Uint8View[13].toString().slice(1) + "." + Uint8View[14].toString().slice(1) );
                    otherPlayers[index].rotation = parseFloat( ((Uint8View[15] === 1) ? -1 : 1) * Uint8View[16] );
                    otherPlayers[index].client = decodedClient;

                }

            }
            break;

        case 6:

            decodedClient = decodeClient( Uint8View.slice(1,9) );

            if (decodedClient === clientID) {

                globalHandler.playerData.health = Uint8View.slice(9,10);

                if (globalHandler.playerData.health < 1) {

                    globalHandler.playerData.health = 100

                    globalHandler.log('Client validation of death');

                }

                document.getElementById("health-stat").innerText = globalHandler.playerData.health;

            }

            break;

        case 7:

            decodedClient = decodeClient( Uint8View.slice(1,9) );

            let ms = decodeClient(Uint8View.slice(9,Uint8View.length));

            let index = otherPlayers.findIndex(obj => obj.client === decodedClient);
            if (index !== -1) { // checks if the player exists

                otherPlayers[index].ms = ms;

            } else if (decodedClient === clientID) {

                clientMS = ms;

            }
            
            let tabInfo = document.getElementById(`client-${decodedClient}`);

            if (tabInfo !== null) {
                tabInfo.children[0].innerText = ms;
            }
          
            break;

        case 8:

            decodedClient = decodeClient( Uint8View.slice(1,9) );
            let attackerClient = decodeClient( Uint8View.slice(9,17) );
            // console.log(decodeClient( Uint8View.slice(9,17) ))
            // console.log(decodedClient)
            sendFeed({
                'attacker': attackerClient,
                'victim': decodedClient
            });

            if (attackerClient === clientID) {
                globalHandler.playSFX("kill.wav");
            }

            if (decodedClient === clientID) {

                globalHandler.log('Server validation of death');
                globalHandler.playSFX("deathcam.wav");
                sendGameAlert('You were killed')
                isDead = true;
                setTimeout(() => {
                    isDead = false;
                    globalHandler.spawn();
                }, 3000);

            } else {
                
                // prepare model for respawning
                let index = otherPlayers.findIndex(obj => obj.client === decodedClient);
                if (index !== -1) { // checks if the player exists

                    otherPlayers[index].x = 0
                    otherPlayers[index].y = 0
                    otherPlayers[index].z = 0

                }

            }

            // Update tab menu stats
            getGameData();

            break;

        default:

            globalHandler.log(`Malformed packet: ${Uint8View}`, "Network")

    }

}

/**
 * Decodes a client's id from a byte array to hex
 * @author  https://stackoverflow.com/users/1326803/jason-dreyzehner
 * @param   {number[]} id The client id in array byte form
 * @returns {string}
 * @version 1.0
 */
const decodeClient = (id) => {return id.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')}

/**
 * Sends a ping JSON object to the server
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 */
function ping() {
    if (connectedToServer) {

        sendData({'type': 'ping'})

        tm = setTimeout(function () {
            globalHandler.log(`Connection Timed Out`)
            connectedToServer = false;
        }, 10000);

    }
}


/**
 * Clears timeout from ping function 
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 */
function pong() {
    clearTimeout(tm);
}

/**
 * Starts the ping-pog cycle between the server and the client with an interval of 15 seconds
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 */
server.onopen = function () {
    setInterval(ping, 30000);
}

function getGameData() {
    try {
        $.ajax({
            // endpoint rendered in EJS
            url: `${endpoint}/api/game`,
            timeout: 3000,
            error: function () {
                console.log(`%c[Network]%c Game API timed out.`,"color: #fff000;","");
            },
            success: function (payload) {
                for (let i=0; i<payload.length; i++) {
                    let curContainer = document.getElementById(`client-${payload[i].id}`).children;
                    curContainer[2].innerText = payload[i].kills;
                    curContainer[3].innerText = payload[i].deaths;
                    curContainer[4].innerText = payload[i].assists;
                    curContainer[5].innerText = payload[i].kills* 2 + payload[i].assists;

                    let index = otherPlayers.findIndex(obj => obj.client === payload[i].id);

                    if (index !== -1) { // checks if the player exists
    
                        otherPlayers[index].username = payload[i].username;
                        curContainer[1].innerText = `${payload[i].username} ${(payload[i].id === clientID) ? '(you)' : ''}`;
    
                    }
                }
            }
        })
    } catch(err) { 
        globalHandler.log(JSON.stringify(err));
    }
}

// Deafults to 600 unless updated by server
let gameTime = 600;
let gameTimers;

/**
 * Converts a clientID to a username
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {number[]} id The client id in hex form
 * @returns {string}
 * @version 1.0
 */
function lookupID(id) {
    // console.log(id)
    if (clientID === id) {
        return `${username} (you)`;
    } else {
        let otherPlayer = otherPlayers.find(x=>x.client === id)
        if (otherPlayer !== undefined) {
            // console.log(otherPlayer)
            return otherPlayer.username
        } else {
            return id;
        }
    }
}

/**
 * Join a game
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 * @todo Pass in a game id and send a join game packet to the server.
 */
function joinGame() {

    document.getElementById('loader').classList.add('fade');

    // Temporarily set tab mode info
    setTabMode(0, "Deathmatch") // Mode
    setTabMode(1, "Dust II") // Map
    setTimeout(() => {
        inGame = true;
        globalHandler.animate();
    }, 400);

    setTimeout(() => {
        document.getElementById('loader').remove();
    }, 2500);

    globalHandler.playMusic("mainmenu.mp3");
    globalHandler.playSFX("cs_stinger.wav");
}

/**
 * Update the game timer
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 */
function updateGameTimers() {
    gameTime--;
    setTabMode(2, gameTime) // Tab mode timer
    if (gameTime === 0) {
        clearInterval(gameTimers);
        globalHandler.gameEndScreen() // transition to the game end screen showing scores etc.
    }
}

/**
 * Returns a string representation of seconds into "minutes:seconds"
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {number} s The number of seconds in to evaluate
 * @returns {string} The evaluated string
 * @version 1.1
 * @example
 * getGameLength(522)
 * Returns "8:42"
 */
 const getGameLength = (s) => {
    return (s === undefined || s <= 0) ? "0:00" : (
        (s < 10) ? '0:0'+s : (
            (s < 60) ? '0:'+s : (
                parseInt(s/60)+':'+(s % 60 < 10 ? "0"+(s % 60) :
                    (s % 60)
                )
            )
        )
    ).toString();
}

/**
 * Handler for the side / escape menu in the game UI
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {number} index The index of the element pressed within the menu
 * @returns {void}
 * @version 1.0
 * @todo Attach functions to menu
 */
function gameMenu(index) {

    if (index === 0) {
        // Return to game
        toggleSideMenu();
    } else if (index === 1) {
        // Settings
        document.getElementById('settings').classList.toggle('hidden');
    } else if (index === 2) {
        // Call vote to kick player
    } else if (index === 3) {
        // Return to home UI
        // Add a confirm exit modal...
        window.location.href = window.location.href.slice(0, window.location.href.lastIndexOf('/'))+'/home';
    } else {
        globalHandler.log('Invalid index on game menu', 'Error');
    }

};

// Attach listeners to the game menu
for (let i=0; i<4; i++) {
    document.getElementById(`gameMenu-${i}`).addEventListener('click', (e) => {
        e.preventDefault();
        gameMenu(i);
    });
};

/**
 * Update game information in the tab ui
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {number} identifier The element index within the tab-mode div to change.
 * @param   {string|number} content The content to change the game tab ui to. Uses a number if identifier is 2 for updating the game timer
 * @returns {void}
 * @version 1.0
 */
function setTabMode(identifier, content) {
    document.getElementById('tab-mode').children[identifier].innerText = (identifier === 2) ? getGameLength(content) : content;
}

/**
 * Display a game alert
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {string} content The text shown in the alert
 * @returns {void}
 * @version 1.0
 */
function sendGameAlert(content) {
    document.getElementById('game-alert').innerHTML = `<div class="alert-container d-flex flex-column align-items-center justify-content-center">
    <h3 class="text-danger mb-0">Alert</h3>
    <h6>${content}</h6>
</div>`
}

/**
 * Display the scores menu
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 */
function showScoresMenu() {
    document.getElementsByClassName('tab-container')[0].style.display = 'flex';
}

/**
 * Hide the scores menu
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 */
function hideScoresMenu() {
    document.getElementsByClassName('tab-container')[0].style.display = 'none';
}

/**
 * Saves user settings in local storage
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {Object} settings The settings encoded in JSON
 * @returns {void}
 * @version 1.0
 */
function saveSettings(settings) {
    if (localStorage && typeof settings == 'object') localStorage.setItem('userSettings', JSON.stringify(settings));
}

/**
 * Changes the user settings to the defualt value in local storage
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 */
function resetSettings() {
    if (localStorage) {
        localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
        globalHandler.renderMainSettings(true);
        globalHandler.log("Reset settings to deafult binds");
    }
}

/**
 * Retrieves user settings from the local storage
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {Object} settings The settings encoded in JSON
 * @version 1.0
 */

function getSettings() {
    if (localStorage) {
        var savedSettings = localStorage.getItem('userSettings');
        if (!savedSettings) resetSettings();
        return JSON.parse(localStorage.getItem('userSettings'));
    }
    return defaultSettings;
}

/**
 * Create a new keybind
 * @author Drew Snow <https://github.com/SnowLord7>
 * @param {Function} func - Function to run on keydown
 * @param {*} code - Identifier to select or remove keybind
 * @param {Number} key - Key to call function
 * @param {Boolean} [false] bool - Does the keybind start as on or off
 */
function addKeyBind(func, code = -1, key = '', bool = false) {
    keybinds.push({
        'key': key,
        'on': bool,
        'func': func,
        'code': code
    });
    if (bool) func();
}

/**
 * Remove keybind(s) with given identifier
 * @author Drew Snow <https://github.com/SnowLord7>
 * @param {*} code - Identifier to find and remove keybind
 * @returns {Boolean} Keybind found or not
 */
function removeKeyBind(code) {
    for (let i = 0; i < keybinds.length; i++) {
        let binds = keybinds;
        if (binds[i].code === code) {
            binds.splice(i, 1);
            return true;
        }
    }
    return false;
}

let keybinds = [];
const binds = keybinds;
const specialKeys = ["Tab", "Escape"];

/**
 * Run the associated function with a keybid
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {KeyboardEvent} e The keyboard event from the event listener
 * @returns {void}
 * @version 1.0
 */
document.body.addEventListener('keydown', (e) => {
    if (specialKeys.indexOf(e.code) !== -1) {
        e.preventDefault();
    }
    for (let i = 0; i < binds.length; i++) {
        let data = binds[i];
        if (e.code === data.code) {
            data.func(data.on);
            data.on = !data.on;
        }
    }
});

/**
 * Check if the key released is configured for interacting with a UI element
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {KeyboardEvent} e The keyboard event from the event listener
 * @returns {void}
 * @version 1.2
 */
 document.addEventListener('keyup',function (e) {

    if (e.code === getSettings().ui.chat.open && !typing) {

        document.getElementById('chat-input').value = "";
        typing = true
        document.getElementById('chat-input').focus();

    } else if (e.code === getSettings().ui.chat.send && typing) {

        document.getElementById('chat-input').blur();
        typing = false;

        if (document.getElementById('chat-input').value != "") {

            sendData({
                'data': document.getElementById('chat-input').value,
                'type': 'chatMessage'
            })

            document.getElementById('chat-input').value = "";

        }
    } else if (e.code === getSettings().ui.scores) {

        e.preventDefault();
        hideScoresMenu();

    }
})

document.getElementById('chat-input').addEventListener('focus', (e) => {
    if (!typing) typing = true;
});

function dropSettings(elem) {
    let clientSettings = getSettings();
    elem.parentElement.parentElement.children[0].innerText = elem.innerText;
    const idCheck = elem.parentElement.parentElement.children[0].id;
    if (idCheck === 'settings-mouse-1') {
        clientSettings.mouse.invert = (elem.innerText === 'Yes') ? true : false;
    } else if (idCheck === 'settings-dev-1') {
        clientSettings.test.devMode = (elem.innerText === 'Yes') ? true : false;
    } else if (idCheck === 'settings-video-1') {
        clientSettings.rendering.shaders = (elem.innerText === 'Yes') ? true : false;
    } else if (idCheck === 'settings-video-2') {
        clientSettings.rendering.luminosity = (elem.innerText === 'Yes') ? true : false;
    } else if (idCheck === 'settings-video-3') {
        clientSettings.rendering.fxaa = (elem.innerText === 'Yes') ? true : false;
    } else if (idCheck === 'settings-video-4') {
        clientSettings.rendering.ssaa = (elem.innerText === 'Yes') ? true : false;
    } else if (idCheck === 'settings-video-5') {
        clientSettings.rendering.arrowHelpers = (elem.innerText === 'Yes') ? true : false;
    }
    saveSettings(clientSettings);
}

const defaultSettings = {
    "movement": {
        "forward": "KeyW",
        "left": "KeyA",
        "right": "KeyD",
        "backward": "KeyS",
        "jump": "Space"
    },
    "mouse": {
        "sensitivity": 25,
        "invert": false
    },
    "crosshair": {
        "offset": 15,
        "cLength": 50,
        "cWidth": 5,
        "r": 255,
        "g": 255,
        "b": 0
    },
    "game": {
        "reload": "KeyR"
    },
    "rendering": {  
        "shaders": false,
        "luminosity": false,
        "fxaa": false,
        "ssaa": false,
        "arrowHelpers": false,
        "sampling": 1,
        "frameLimit": 60,
        "quality": window.devicePixelRatio
    },
    "audio": {
        "master": 0.1,
        "music": 0.5,
        "sfx": 0.6
    },
    "test": {
        "devMode": true,
        "dev": "KeyQ",
        "stats": "KeyE",
        "key": "KeyX"
    },
    "ui": {
        "scores": "Tab",
        "chat": {
            "open": "KeyY",
            "send": "Enter"
        },
        "sidemenu": "Escape"
    }
}

function renderCrosshair(offset = 15, length = 50, width = 5, color = 'yellow') {
    function render() {
        // Color
        crosshair.style.setProperty('--crosshair', color);
        // X Axis
        crosshair.children[0].style.width = `${length}px`;
        crosshair.children[0].style.height = `${width}px`;
        crosshair.children[0].children[0].style.transform = `translateX(-${offset}px)`;
        crosshair.children[0].children[1].style.transform = `translateX(${offset}px)`;
        // Y Axis
        crosshair.children[1].style.width = `${width}px`;
        crosshair.children[1].style.height = `${length}px`;
        crosshair.children[1].children[0].style.transform = `translateY(-${offset}px)`;
        crosshair.children[1].children[1].style.transform = `translateY(${offset}px)`;
        // Center
        crosshair.children[2].style.width = `${width}px`;
        crosshair.children[2].style.height = `${width}px`;
    }
    let crosshair = document.getElementById('crosshair');
    render()
    crosshair = document.getElementById('settings-crosshair');
    render()
}

let wireframeOn = false;
let statsOn = false;
// Map binds
addKeyBind(() => {if (getSettings().test.devMode) {globalHandler.log("Triggered Test Bind", "Debug")}}, getSettings().test.key);
addKeyBind(showScoresMenu, getSettings().ui.scores);
addKeyBind(toggleSideMenu, getSettings().ui.sidemenu);
addKeyBind(() => {if (getSettings().test.devMode) {
    wireframeOn = !wireframeOn;
    globalHandler.wireframe(wireframeOn);
    globalHandler.log(`${wireframeOn ? 'En' : 'Dis'}abled wireframe`, "Debug")}
}, getSettings().test.dev);
addKeyBind(() => {if (getSettings().test.devMode) {
    statsOn = !statsOn;
    globalHandler.showStats(statsOn);
    globalHandler.log(`${statsOn ? 'En' : 'Dis'}abled stats`, "Debug")}
}, getSettings().test.stats);

/**
 * Display the scores menu
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 */
function toggleSideMenu() {
    document.getElementById('settings').classList.add('hidden');
    document.getElementById('menu').classList.toggle('hidden');
}

// Handler for pointer locking
document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

let locked = false;

function lockChangeAlert() {
  if (document.pointerLockElement === document.body ||
      document.mozPointerLockElement === document.body) {
    if (!locked) {
        globalHandler.log('The pointer lock status is now locked','Debug');
        if (document.getElementById('menu').classList.length === 0) {
            // Hide the menu
            toggleSideMenu();
        };
        locked = true;
    }
  } else {
    globalHandler.log('The pointer lock status is now unlocked', 'Debug');  
    if (locked) {
        if (document.getElementById('menu').classList.length === 1) {
            // Show the menu
            toggleSideMenu();
        }
        locked = false;
    }
  }
}

/**
 * Renders a message in the kill feed
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {Object} data JSON object that contains the event
 * @todo    implement multiple weapons
 * @returns {void}
 * @version 1.0
 * @example
 * sendFeed({
 *  'attacker': 'clientID',
 *  'victim': 'clientID
 * })
 */
function sendFeed(data) {
    document.getElementById('feed-container').innerHTML += `<div class="d-flex align-items-center">
    <p class="mb-0 text-warning">${lookupID(data.attacker)}</p>
    <img src="./assets/feed/ak-47.svg" class="mx-2" style="width: 40px">
    <p class="mb-0 text-info">${lookupID(data.victim)}</p>
</div>`;
    setTimeout(() => {
        document.getElementById('feed-container').children[0].remove();
    }, 5000);
}

/**
 * A function in globalHandler (globalHandler.getSettings)
 * @author      Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @returns     {void}
 * @version     1.0
 */
globalHandler.getSettings = () => getSettings();

/**
 * An array to store the other client information
 * @author      Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @returns     {void}
 * @version     1.0
 */
globalHandler.otherPlayers = () => {return otherPlayers};