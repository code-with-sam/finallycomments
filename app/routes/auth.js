let express = require('express');
let steem = require('../modules/steemconnect')
let router = express.Router();

/* GET auth listing. */
router.get('/', (req, res, next) => {
    if (!req.query.access_token ) {
        let uri = steem.getLoginURL();
        console.log(uri);
        res.redirect(uri);
    } else {
        steem.setAccessToken(req.query.access_token);
        steem.me((err, steemResponse) => {
          req.session.steemconnect = steemResponse.account;
          res.redirect('/user')
        });
    }
});

router.get('/logout', (req, res) => {
   req.session.destroy();
   res.redirect("/")
});

module.exports = router;
