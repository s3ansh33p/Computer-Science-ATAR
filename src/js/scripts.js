
// Networking
var server = new WebSocket("ws://localhost:8999");
function sendData(data) {
    server.send(JSON.stringify(data));
}
let clientID = 0;
let otherPlayers = [];
let typing = false;

server.onmessage = function (event) {
    if (JSON.parse(event.data).type == "pong") {
        pong();
    } else if (JSON.parse(event.data).type == "broadcast") {
        console.log(event.data);
        if (otherPlayers.length != 0) {
            let index = otherPlayers.findIndex(obj => obj.client == JSON.parse(event.data).data.client);
            if (index != -1) { // checks if the player exists
                otherPlayers[index] = JSON.parse(event.data).data.playerData;
                otherPlayers[index].client = JSON.parse(event.data).data.client;
            }
        }
    } else if (JSON.parse(event.data).type == "connection") {
        // console.log(event.data);
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
    sendData({'type': 'ping'})
    tm = setTimeout(function () {
       console.log('Connection Timed Out')
       server.close();
    }, 5000);
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
