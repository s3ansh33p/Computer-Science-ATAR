
// Web Sockets
var server = new WebSocket("ws://localhost:8999");
function sendData(data) {
    server.send(JSON.stringify(data));
}

server.onmessage = function (event) {
    console.log(event.data);
    if (JSON.parse(event.data).type == "pong") {
        pong();
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
        'player': {
            'x':10,
            'y':5,
            'z':23,
            'hasFlag':false
        }
    },
    'type': 'updatePlayer'
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
