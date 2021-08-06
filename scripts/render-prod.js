'use strict';
const upath = require('upath');
const sh = require('shelljs');

module.exports = function renderProd() {
    // Change websocket from localhost to website
    sh.sed('-i', 'ws://localhost:8999', 'wss://socket.seanmcginty.space', upath.resolve(upath.dirname(__filename),'../dist/public/js/scripts.js'));
};