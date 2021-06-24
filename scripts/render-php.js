'use strict';
const fs = require('fs');
const upath = require('upath');
const sh = require('shelljs');

module.exports = function renderPHP() {
    const sourcePath = upath.resolve(upath.dirname(__filename), '../src/php');
    const destPath = upath.resolve(upath.dirname(__filename), '../dist/.');
    
    sh.cp('-R', sourcePath, destPath)
    sh.cp('-R', upath.resolve(upath.dirname(__filename), '../src/index.php'), upath.resolve(upath.dirname(__filename), '../dist/index.php'))
    sh.cp('-R', upath.resolve(upath.dirname(__filename), '../src/config.php'), upath.resolve(upath.dirname(__filename), '../dist/config.php'))
    sh.cp('-R', upath.resolve(upath.dirname(__filename), '../src/.htaccess'), upath.resolve(upath.dirname(__filename), '../dist/.htaccess'))
};