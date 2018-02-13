let express = require('express');
let steem = require('../modules/steemconnect')
let util = require('../modules/util');
let router = express.Router();

/* GET auth listing. */
router.get('/:tag/:author/:permlink?', (req, res, next) => {
    if (!req.query.access_token ) {
        console.log('not token, creatring auth link from params')
        let tag = req.params.tag
        let author = req.params.author
        let permlink = req.params.permlink
        let state = `tag=${tag}&author=${author}&permlink=${permlink}`
        console.log('state: ', state)

        let uri = steem.getLoginURL(state);
        res.redirect(uri);
    } else {
      console.log('already has a token and trying to login again')
        steem.setAccessToken(req.query.access_token);
        steem.me((err, steemResponse) => {
          req.session.steemconnect = steemResponse.account;
          let decodedState = req.query.state.replace(/&amp;/g, '&');
          let state = util.splitQueryString(decodedState)
          let url = `/thread/${state.tag}/${state.author}/${state.permlink}`
          res.redirect(url)
        });
    }
});
router.get('/', (req, res, next) => {
    if (!req.query.access_token ) {
        //  redirect and give message
        // you must select a thread etc..
    } else {
      console.log('redirected from steemconnect, setting token')
        steem.setAccessToken(req.query.access_token);
        steem.me((err, steemResponse) => {
          req.session.steemconnect = steemResponse.account;
          let decodedState = req.query.state.replace(/&amp;/g, '&');
          let state = util.splitQueryString(decodedState)
          let url = `/thread/${state.tag}/${state.author}/${state.permlink}`
          res.redirect(url)
        });
    }
});

router.get('/logout', (req, res) => {
  steem.revokeToken((err, steemResponse) => {
      req.session.destroy();
      res.redirect("/")
  });
});

module.exports = router;
