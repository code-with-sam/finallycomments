let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) =>  {
  if(req.session.steemconnect){
    res.redirect('/')
  } else {
    res.render('index', { title: 'SteemConnect Comments' });
  }
});

module.exports = router;
