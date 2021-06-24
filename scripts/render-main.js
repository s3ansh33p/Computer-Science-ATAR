'use strict';
const fs = require('fs');
const upath = require('upath');
const sh = require('shelljs');

module.exports = function renderPHP() {
    const sourcePath = upath.resolve(upath.dirname(__filename), '../src/views');
    const destPath = upath.resolve(upath.dirname(__filename), '../dist/.');
    
    sh.cp('-R', sourcePath, destPath)
    sh.cp('-R', upath.resolve(upath.dirname(__filename), '../src/app.js'), upath.resolve(upath.dirname(__filename), '../dist/app.js'))
};