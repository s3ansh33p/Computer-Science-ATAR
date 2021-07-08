'use strict';
const fs = require('fs');
const upath = require('upath');
const sh = require('shelljs');

module.exports = function renderMain() {
    let sourcePath = upath.resolve(upath.dirname(__filename), '../src/views');
    let destPath = upath.resolve(upath.dirname(__filename), '../dist/.');
    sh.cp('-R', sourcePath, destPath)

    sourcePath = upath.resolve(upath.dirname(__filename), '../src/server');
    destPath = upath.resolve(upath.dirname(__filename), '../dist/.');
    sh.cp('-R', sourcePath, destPath)

    sh.cp('-R', upath.resolve(upath.dirname(__filename), '../src/app.js'), upath.resolve(upath.dirname(__filename), '../dist/app.js'))
    sh.cp('-R', upath.resolve(upath.dirname(__filename), '../src/.env'), upath.resolve(upath.dirname(__filename), '../dist/.env'))
};