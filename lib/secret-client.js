const _ = require('the-lodash');
const Promise = require('the-promise');
const NodeRSA = require('node-rsa');

class SecretClient 
{
    constructor(berlioz, name, AWS)
    {
        this._berlioz = berlioz
        this._name = name
        this._AWS = AWS
    }

    _getKey(kind)
    {
        var client = this._berlioz._getNativeResourceClient([kind, this._name], this._AWS)
        var params = {
            WithDecryption: true
        };
        return client.getParameter(params)
            .then(result => {
                return result.Parameter.Value;
            })
    }

    encrypt(data)
    {
        return Promise.resolve(this._getKey('secret_public_key'))
            .then(key => {
                const keyObj = new NodeRSA(key);
                const encrypted = keyObj.encrypt(data, 'base64');
                return encrypted;
            })
            .catch(reason => {
                console.log(reason)
                return null;
            }) 
    }

    decrypt(data)
    {
        return Promise.resolve(this._getKey('secret_private_key'))
            .then(key => {
                const keyObj = new NodeRSA(key);
                const decrypted = keyObj.decrypt(data);
                return decrypted.toString();
            })
            .catch(reason => {
                console.log(reason)
                return null;
            }) 

    }

}

module.exports = SecretClient;

