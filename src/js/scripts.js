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
    const typings = [ "PING", "CHATMESSAGE" , "PLAYERUPDATE" , "AUTH" ];

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
 * The players client id used or networking
 * @type {string}
 */
let clientID = '';

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

    switch(Uint8View[0]) {

        case 0:

            pong();
            break;

        case 1:

            connectedToServer = true;
            clientID = decodeClient(Uint8View.slice(1));

            const conMS = Math.round(timerEnd('connectionMS'));
            document.getElementsByClassName('loading-text')[0].innerHTML = `<p>Connected to server in ${conMS}ms</p>`;

            sendData({
                'data': {
                         'code': 12345678, // Todo: add auth generation and server side validation
                         'userid': userid // Defined in game.ejs from session
                },
                'type': 'auth'
               })
            break;

        case 2:

            otherPlayers = []; // Defined in game.js

            for (let i = 0; i < Uint8View[1]; i++) {

                const decodedClient = decodeClient( Uint8View.slice( 2+i*9 , 10+i*9 ) );

                if ( decodedClient !== clientID) {

                    otherPlayers.push({ 
                        'x':0,
                        'y':0,
                        'z':0,
                        'rotation': 0,
                        'client': decodedClient
                    })

                }

            }
            break;

        case 3:

            const chatContainer = document.getElementById('chat-msg-container');

            let serverMsg = (decodeClient(Uint8Array.from(Uint8View.slice(1,9))) === '1000000000000000');
            chatContainer.innerHTML = `<div class="chat-wrapper"><div class="chat-msg"><span${serverMsg ? ' style="color: #f00"' : ''}>${serverMsg ? '[SERVER]' : decodeClient(Uint8Array.from(Uint8View.slice(1,9)))}: </span>${new TextDecoder("utf-8").decode(Uint8View.slice(9))}</div></div>` + chatContainer.innerHTML;
            
            if (chatContainer.children.length > 20) {

                chatContainer.children[20].remove();

            }
            break;

        case 4:
            
            if (otherPlayers.length !== 0) {

                const decodedClient = decodeClient( Uint8View.slice(1,9) );

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

let gameTime = 600;
let gameTimers;

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
    gameTimers = setInterval(() => {
        updateGameTimers();
    }, 1000); // Timer

    setTimeout(() => {
        inGame = true;
        globalHandler.animate();
    }, 400);

    setTimeout(() => {
        document.getElementById('loader').remove();
    }, 2500);

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
    if (index === 4) {
        globalHandler.log('Leaving game', 'Debug');
        window.location.href = window.location.href.slice(0, window.location.href.lastIndexOf('/'))+'/home';
    } else {
        globalHandler.log(`Clicked on menu index ${index}`, 'Debug');
    }
};

// Attach listeners to the game menu
for (let i=0; i<5; i++) {
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

const defaultSettings = {
    "movement": {
        "forward": "KeyW",
        "left": "KeyA",
        "right": "KeyD",
        "backward": "KeyS",
        "jump": "Space"
    },
    "test": {
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

function test() {
    console.log('Binded Key')
}

// Map binds
addKeyBind(test, getSettings().test.key);
addKeyBind(showScoresMenu, getSettings().ui.scores);
addKeyBind(toggleSideMenu, getSettings().ui.sidemenu);

/**
 * Display the scores menu
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 */
function toggleSideMenu() {
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
 * A function in globalHandler (globalHandler.getSettings)
 * @author      Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @returns     {void}
 * @version     1.0
 */
globalHandler.getSettings = () => getSettings();


// temp 
resetSettings();