let express = require('express');
let util = require('../modules/util');
let steem = require('../modules/steemconnect')
let db = require('../modules/db')
let router = express.Router();
const Thread = require('../models/thread')
const Token = require('../models/token')

router.get('/', util.isAuthenticated, async (req, res, next) =>  {
  let username = req.session.steemconnect.name
  let threads = await Thread.find(username)
  let token = false;
  try { token = await Token.findOne(username) } catch(error){ console.log(error) }

  res.render('dashboard', {
    css : 'bulma',
    name: req.session.steemconnect.name,
    threads: threads,
    token: token.refresh? true : false
  })
});

module.exports = router;
