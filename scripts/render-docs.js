'use strict';
const fs = require('fs');
const upath = require('upath');
const sh = require('shelljs');

module.exports = function renderDocs() {
    const sourcePath = upath.resolve(upath.dirname(__filename), '../out');
    const destPath = upath.resolve(upath.dirname(__filename), '../dist/docs/.');
    
    sh.cp('-R', sourcePath, destPath)
};