
// Networking
var server = new WebSocket("ws://localhost:8999");
// var server = new WebSocket("ws://socket.seanmcginty.space");
function sendData(data) {
    server.send(JSON.stringify(data));
}
let clientID = 0;
let otherPlayers = [];
let typing = false;
let connectedToServer = false;
let inGame = false;

var timers = {};
function timer(name) {
    timers[name + '_start'] = window.performance.now();
}

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

server.onmessage = function (event) {
    if (JSON.parse(event.data).type == "pong") {
        pong();
    } else if (JSON.parse(event.data).type == "broadcast") {
        // console.log(event.data);
        if (otherPlayers.length != 0) {
            let index = otherPlayers.findIndex(obj => obj.client == JSON.parse(event.data).data.client);
            if (index != -1) { // checks if the player exists
                otherPlayers[index] = JSON.parse(event.data).data.playerData;
                otherPlayers[index].client = JSON.parse(event.data).data.client;
            }
        }
    } else if (JSON.parse(event.data).type == "connection") {
        // console.log(event.data);
        connectedToServer = true;
        const conMS = Math.round(timerEnd('connectionMS')*100)/100;
        document.getElementsByClassName('loading-text')[0].innerHTML = `<p>Connected to server in ${conMS}ms</p><button class="btn btn-dark" onclick="joinGame();">Join Game</button>`;
        clientID = JSON.parse(event.data).data;
    } else if (JSON.parse(event.data).type == "chat") {
        console.log(event.data);
        const chatContainer = document.getElementById('chat-msg-container');
        chatContainer.innerHTML = `<div class="chat-wrapper"><div class="chat-msg"><span>${JSON.parse(event.data).data.client}: </span>${JSON.parse(event.data).data.message}</div></div>` + chatContainer.innerHTML;
        if (chatContainer.children.length > 20) {
            chatContainer.children[20].remove();
        }
    } else if (JSON.parse(event.data).type == "activePlayers") {
        // console.log("Active Players: %s", event.data);
        otherPlayers = []; // Defined in game.js
        for (let i=0; i<JSON.parse(event.data).data.length; i++) {
            if (JSON.parse(event.data).data[i].client != clientID) {
                console.log(JSON.parse(event.data).data[i])
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

function ping() {
    if (connectedToServer) {
        sendData({'type': 'ping'})
        tm = setTimeout(function () {
        console.log('Connection Timed Out')
        connectedToServer = false;
        server.close();
        }, 5000);
    }
}

function pong() {
    clearTimeout(tm);
}

server.onopen = function () {
    setInterval(ping, 15000);
}

let packet = {
    'data':{
        'x':10,
        'y':5,
        'z':23,
        'rotation': 0,
        'hasFlag':false
    },
    'type': 'playerUpdate'
}

// Chat
document.addEventListener('keyup',function(e){
    if (e.code == "KeyY" && !typing) { // Change KeyY to be configurable in a menu
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
})

// Load UI
function joinGame() {

    document.getElementById('loader').classList.add('fade');

    setTimeout(() => {
        inGame = true;
    }, 400);

    setTimeout(() => {
        document.getElementById('loader').remove();
    }, 2500);

}

// UI
window.addEventListener('DOMContentLoaded', event => {

    // Toggle the side navigation
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        // Uncomment Below to persist sidebar toggle between refreshes
        // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
        //     document.body.classList.toggle('sb-sidenav-toggled');
        // }
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
            localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
        });
    }

});
