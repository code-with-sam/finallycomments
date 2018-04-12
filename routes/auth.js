let express = require('express');
let rp = require('request-promise');
let { steem, getRefreshToken } = require('../modules/steemconnect')
let util = require('../modules/util');
let router = express.Router();
let config = require('../config')

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
        console.log(uri)
        res.redirect(uri);
    } else {
        steem.setAccessToken(req.query.access_token);
        steem.me((err, steemResponse) => {
          req.session.steemconnect = steemResponse.account;
          req.session.access_token = req.query.access_token;
          res.render('auth-success')
        });
    }
});

router.get('/', async (req, res, next) => {
    if (!req.query.access_token && !req.query.code) {
      console.log('', req.query)
      res.redirect(`/`)
    }
    else if (req.query.code ) {
      await getRefreshToken(req.query.code)
      res.redirect('/dashboard#api')
    } else {
      console.log('redirected from steemconnect, setting token')
        steem.setAccessToken(req.query.access_token);
        steem.me((err, steemResponse) => {
          req.session.steemconnect = steemResponse.account;
          req.session.access_token = req.query.access_token;

          let decodedState = req.query.state.replace(/&amp;/g, '&');
          let state = util.splitQueryString(decodedState)
          let url = ''
          if(state.next) {
            url = `/${state.next}`
            res.redirect(url)
          } else {
            res.render('auth-success')
          }
        });
    }
});



router.get('/logout/', (req, res) => {
  steem.revokeToken((err, steemResponse) => {
      req.session.destroy();
      res.redirect(`/`)
  });
});

router.get('/logout/:tag/:author/:permlink', (req, res) => {
  let tag = req.params.tag
  let author = req.params.author
  let permlink = req.params.permlink
  console.log(`/thread/${tag}/${author}/${permlink}`)
  steem.revokeToken((err, steemResponse) => {
      req.session.destroy();
      res.redirect(`/thread/${tag}/${author}/${permlink}`)
  });
});

router.get('/refresh', (req, res) => {
  let scope = 'vote,comment,offline'
  let redirectUri = config.auth.redirect_uri
  let clientId = config.auth.client_id
  let state = encodeURIComponent(`next=dashboard`)
  let url = `https://v2.steemconnect.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`
  console.log('REFRESH TOKEN URL: ', url)
  res.redirect(url)
})

router.get('/:next', (req, res) => {
    if (!req.query.access_token ) {
        console.log('no token, creating auth link from params')
        let next = req.params.next
        let state = `next=${next}`
        let uri = steem.getLoginURL(state);
        res.redirect(uri);
    } else {
      res.redirect(`/${req.params.next}`)
    }
});


module.exports = router;
