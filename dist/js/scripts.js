/*!
* Sean McGinty - Computer Science Project v0.0.1 (https://uat.seanmcginty.space/admin)
* Copyright 2021-2021 Sean McGinty
* Licensed under MIT (https://github.com/s3ansh33p/computer-science-atar/blob/master/LICENSE)
*/

// Web Sockets
var exampleSocket = new WebSocket("wss://localhost/Computer-Science-ATAR/dist/server");
function initWS() {
    exampleSocket.send("Here's some text that the server is urgently awaiting!");
}

exampleSocket.onmessage = function (event) {
    console.log(event.data);
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
