const crypto = require('crypto');
require('dotenv').config( { 'path': __dirname+'/../.env' });
const algorithm = 'aes-256-ctr';
const secretKey = process.env.ENC_KEY; // crypto.randomBytes(16).toString('hex')
const iv = Buffer.from(process.env.ENC_IV, 'hex'); // crypto.randomBytes(16).toString('hex')

const encrypt = (text) => {

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return encrypted.toString('hex');
};

const decrypt = (hash) => {

    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);

    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, 'hex')), decipher.final()]);

    return decrpyted.toString();
};

module.exports = {
    encrypt,
    decrypt
};