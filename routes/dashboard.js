let express = require('express');
let util = require('../modules/util');
let steem = require('../modules/steemconnect')
let db = require('../modules/db')
let router = express.Router();

router.get('/', util.isAuthenticated, (req, res, next) =>  {
  let author = req.session.steemconnect.name
  db.get().db('finally').collection('threads').find({'author': author }).toArray( (err,result) => {
    res.render('dashboard', {
      css : 'bulma',
      name: req.session.steemconnect.name,
      threads: result.reverse()
    });
  })
});

module.exports = router;
