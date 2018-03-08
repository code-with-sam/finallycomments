let express = require('express');
let util = require('../modules/util');
let steem = require('../modules/steemconnect')
let router = express.Router();

router.get('/', util.isAuthenticated, (req, res, next) =>  {
  res.render('dashboard', {
    css : 'bulma',
    name: req.session.steemconnect.name
  });
});

module.exports = router;
