let express = require('express');
let util = require('../modules/util');
let { steem } = require('../modules/steemconnect')
let db = require('../modules/db')
let router = express.Router();
const Thread = require('../models/thread')
const Token = require('../models/token')
const Domain = require('../models/domain')

router.get('/', util.isAuthenticated, async (req, res, next) =>  {
  let username = req.session.steemconnect.name
  let threads ;
  try { threads = await Thread.find(username)} catch(error){ console.log(error) }
  let domains;
  try { domains = await Domain.findOne(username) } catch(error){ console.log(error) }
  console.log(domains)
  let token = false;
  try { token = await Token.findOne(username) } catch(error){ console.log(error) }

  res.render('dashboard', {
    css : 'bulma',
    name: req.session.steemconnect.name,
    threads: threads,
    token: token.refresh? true : false,
    domains: domains.list
  })
});

router.post('/domains', util.isAuthenticated, async (req, res, next) =>  {
  let username = req.session.steemconnect.name
  let domains = JSON.parse(req.body.domains)
  console.log(req.body)
  console.log(domains)
  try {
    let result = await Domain.insertOne({username: username, domains: domains})
    res.json({error :false, result: result})
  } catch(error){
    console.log(error)
    res.json({error: 'could not insert domains'})
  }
})

module.exports = router;
