const concurrently = require('concurrently');
const upath = require('upath');

concurrently([
    { command: 'node scripts/sb-watch.js', name: 'SB_WATCH', prefixColor: 'bgBlue.bold' },
    { command: 'node dist/app.js', name: 'EXPRESS', prefixColor: 'bgYellow.bold' }
], {
    prefix: 'name',
    killOthers: ['failure', 'success'],
}).then(success, failure);

function success() {
    console.log('Success');    
}

function failure() {
    console.log('Failure');
}