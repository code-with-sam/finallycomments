let express = require('express');
let steem = require('../modules/steemconnect')
let util = require('../modules/util');
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
          console.log(req.query.state)
          var decodedState = req.query.state.replace(/&amp;/g, '&');
          console.log(decodedState)

          let state = util.splitQueryString(decodedState)
          console.log(state)
          let url = `/thread/${state.tag}/${state.author}/${state.permlink}`


          res.redirect(url)
        });
    }
});

router.get('/logout', (req, res) => {
   req.session.destroy();
   res.redirect("/")
});

module.exports = router;
