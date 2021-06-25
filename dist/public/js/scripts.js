/*!
* Sean McGinty - Computer Science Project v0.0.1 (https://uat.seanmcginty.space/admin)
* Copyright 2021 Sean McGinty
* Licensed under MIT (https://github.com/s3ansh33p/computer-science-atar/blob/master/LICENSE)
*/

// Networking
var server = new WebSocket("ws://localhost:8999");
function sendData(data) {
    server.send(JSON.stringify(data));
}

server.onmessage = function (event) {
    if (JSON.parse(event.data).type == "pong") {
        pong();
    } else if (JSON.parse(event.data).type == "broadcast") {
        console.log(event.data);
    } else if (JSON.parse(event.data).type == "activePlayers") {
        console.log("Active Players: %s", event.data);
    }
}

function ping() {
    sendData({'type': 'ping'})
    tm = setTimeout(function () {
       console.log('Connection Timed Out')
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
        'hasFlag':false
    },
    'type': 'playerUpdate'
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
