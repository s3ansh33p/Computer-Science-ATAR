/**
 * A websocket connection to the server for networking
 * @constant
 * @type {WebSocket}
 */
const server = new WebSocket("ws://localhost:8999");
// const server = new WebSocket("wss://socket.seanmcginty.space");

/**
 * Sends a JSON object to the server via a websocket
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {Object} data JSON object usually with data and type
 * @returns {void}
 * @version 1.0
 * @example
 * sendData({
 *  'data': {
 *           'x':        10,
 *           'y':        5,
 *           'z':        23,
 *           'rotation': 0,
 *           'hasFlag':  false
 *  },
 *  'type': 'playerUpdate'
 * })
 * @todo Optimize Websocket communiation with binary messages
 */
function sendData(data) {

    server.send(JSON.stringify(data));

}

let clientID = 0;
let otherPlayers = [];
let typing = false;
let connectedToServer = false; // Potentially store this and status info in one variable. Like status = 1 | 2 | 3 ... 'connected', 'ingame', 'disconnected' etc
let inGame = false;

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

timer('connectionMS');

/**
 * Returns a string representation of seconds into "minutes:seconds"
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {number} s The number of seconds in to evaluate
 * @returns {string} The evaluated string
 * @version 1.0
 * @example
 * getGameLength(522)
 * Returns "8:42"
 */
const getGameLength = (s) => {
    return (s === undefined) ? "0:00" : (
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
 * Callback function that is called when the client receives a message from the server.
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {Object} event The message contents
 * @returns {void}
 * @version 1.0
 */
server.onmessage = function (event) {

    // console.log(event.data);

    if (JSON.parse(event.data).type == "pong") {

        pong();

    } else if (JSON.parse(event.data).type == "broadcast") {

        if (otherPlayers.length != 0) {

            let index = otherPlayers.findIndex(obj => obj.client == JSON.parse(event.data).data.client);

            if (index != -1) { // checks if the player exists

                otherPlayers[index] = JSON.parse(event.data).data.playerData;
                otherPlayers[index].client = JSON.parse(event.data).data.client;

            }

        }

    } else if (JSON.parse(event.data).type == "connection") {

        connectedToServer = true;
        clientID = JSON.parse(event.data).data;

        const conMS = Math.round(timerEnd('connectionMS'));
        document.getElementsByClassName('loading-text')[0].innerHTML = `<p>Connected to server in ${conMS}ms</p>`;

    } else if (JSON.parse(event.data).type == "chat") {

        const chatContainer = document.getElementById('chat-msg-container');

        chatContainer.innerHTML = `<div class="chat-wrapper"><div class="chat-msg"><span>${JSON.parse(event.data).data.client}: </span>${JSON.parse(event.data).data.message}</div></div>` + chatContainer.innerHTML;
        
        if (chatContainer.children.length > 20) {

            chatContainer.children[20].remove();

        }

    } else if (JSON.parse(event.data).type == "activePlayers") {

        otherPlayers = []; // Defined in game.js

        for (let i=0; i<JSON.parse(event.data).data.length; i++) {

            if (JSON.parse(event.data).data[i].client != clientID) {

                // console.log(JSON.parse(event.data).data[i])

                otherPlayers.push({ 
                    'x':0,
                    'y':0,
                    'z':0,
                    'rotation': 0,
                    'hasFlag': false,
                    'client': JSON.parse(event.data).data[i].client
                })

            }

        }

    }

}

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
            console.log('Connection Timed Out')
            connectedToServer = false;
        }, 5000);

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
    setInterval(ping, 15000);
}

document.addEventListener('keyup',checkUI(e))

/**
 * Check if the key released is configured for interacting with a UI element
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {KeyboardEvent} e The keyboard event from the event listener
 * @returns {void}
 * @version 1.0
 * @todo Change KeyY to be configurable in a menu / settings
 */
function checkUI (e) {

    if (e.code == "KeyY" && !typing) {

        document.getElementById('chat-input').value = "";
        typing = true
        document.getElementById('chat-input').focus();

    } else if (e.code == "Enter" && typing) {

        document.getElementById('chat-input').blur();
        typing = false;

        if (document.getElementById('chat-input').value != "") {

            sendData({
                'data':document.getElementById('chat-input').value,
                'type': 'chatMessage'
            })

            document.getElementById('chat-input').value = "";

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

    setTimeout(() => {
        inGame = true;
    }, 400);

    setTimeout(() => {
        document.getElementById('loader').remove();
    }, 2500);

}