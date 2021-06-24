'use strict';

const _ = require('lodash');
const chokidar = require('chokidar');
const upath = require('upath');
const renderAssets = require('./render-assets');
const renderScripts = require('./render-scripts');
const renderSCSS = require('./render-scss');
const renderPHP = require('./render-php');

const watcher = chokidar.watch('src', {
    persistent: true,
});

let READY = false;

process.title = 'scss-watch';
process.stdout.write('Loading');

watcher.on('add', filePath => _processFile(upath.normalize(filePath), 'add'));
watcher.on('change', filePath => _processFile(upath.normalize(filePath), 'change'));
watcher.on('ready', () => {
    READY = true;
    console.log('Setup complete, watching files...');
});

_handleSCSS();

function _processFile(filePath, watchEvent) {

    console.log(`### INFO: File event: ${watchEvent}: ${filePath}`);

    if (filePath.match(/\.scss$/)) {
        if (watchEvent === 'change') {
            return _handleSCSS(filePath, watchEvent);
        }
        return;
    }

    if (filePath.match(/\.php$/)) {
        if (watchEvent === 'change') {
            return _handlePHP(filePath, watchEvent);
        }
        return;
    }

    if (filePath.match(/src\/js\//)) {
        return renderScripts();
    }

    if (filePath.match(/src\/assets\//)) {
        return renderAssets();
    }

}

function _handleSCSS() {
    renderSCSS();
}

function _handlePHP() {
    renderPHP();
}