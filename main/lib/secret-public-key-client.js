const _ = require('the-lodash');
const Promise = require('the-promise');
const NodeRSA = require('node-rsa');

class SecretPublicKeyClient 
{
    constructor(berlioz, name, AWS)
    {
        this._berlioz = berlioz
        this._name = name
        this._AWS = AWS
    }

    _getKey()
    {
        var client = this._berlioz.getSecretPublicKeyClient(this._name, this._AWS);
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
        return Promise.resolve(this._getKey())
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

}

module.exports = SecretPublicKeyClient;

