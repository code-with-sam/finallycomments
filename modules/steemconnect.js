const rp = require('request-promise');
let steemconnect2 = require('sc2-sdk');
let config = require('../config')
const Token = require('../models/token')

let steem = steemconnect2.Initialize({
    app: config.auth.client_id,
    callbackURL: config.auth.redirect_uri,
    scope: ['login','vote', 'comment']
});

let getRefreshToken = (code) => {
  return new Promise(function(resolve, reject) {
    rp({
      method: 'POST',
      uri: 'https://steemconnect.com/api/oauth2/token',
      body: {
        response_type: 'refresh',
        code: code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        scope: 'comment,offline'
      },
      json: true
    })
    .then( async (results) => {
      let user = {
        username: results.username,
        refresh: results.refresh_token,
        access: results.refresh_toke
      }
      resolve(await Token.insert(user));
    })
  });
}

let getAccessFromRefresh = async (username) => {
    let token = await Token.findOne(username)
    return rp({
      method: 'POST',
      uri: 'https://v2.steemconnect.com/api/oauth2/token',
      body: {
        refresh_token: token.refresh,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        scope: 'comment,offline'
      },
      json: true
    })
}


module.exports = { steem, getRefreshToken, getAccessFromRefresh };
