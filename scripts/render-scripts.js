'use strict';
const fs = require('fs');
const packageJSON = require('../package.json');
const upath = require('upath');
const sh = require('shelljs');

module.exports = function renderScripts() {

    const sourcePath = upath.resolve(upath.dirname(__filename), '../src/js');
    const destPath = upath.resolve(upath.dirname(__filename), '../dist/public/.');
    
    sh.cp('-R', sourcePath, destPath)

    const files = ['scripts','game','ui'];
    
    const copyright = `/*!
* Sean McGinty - ${packageJSON.title} v${packageJSON.version} (${packageJSON.homepage})
* Copyright ${new Date().getFullYear()} ${packageJSON.author}
* Licensed under ${packageJSON.license} (https://github.com/s3ansh33p/${packageJSON.name}/blob/master/LICENSE)
*/
`
    
    for (let i=0; i<files.length; i++) {
        
        let sourcePathScriptsJS = upath.resolve(upath.dirname(__filename), `../src/js/${files[i]}.js`);
        let destPathScriptsJS = upath.resolve(upath.dirname(__filename), `../dist/public/js/${files[i]}.js`);
        let scriptsJS = fs.readFileSync(sourcePathScriptsJS);
        
        fs.writeFileSync(destPathScriptsJS, copyright + scriptsJS);
    }
};