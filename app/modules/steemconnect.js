let steemconnect2 = require('sc2-sdk');
let config = require('../config')

let steem = steemconnect2.Initialize({
    app: config.auth.client_id,
    callbackURL: config.auth.redirect_uri,
    scope: ['login','vote', 'comment']
});

module.exports = steem;
