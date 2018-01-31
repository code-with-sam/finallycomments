let express = require('express');
let router = express.Router();
let util = require('../modules/util');
let steem = require('../modules/steemconnect')

/* GET home page. */
router.get('/login', (req, res, next) =>  {
  if(req.session.steemconnect){
    res.redirect(`/`)
  } else {
    res.render('index', { title: 'SteemConnect Comments' });
  }
});

router.get('/thread/:tag/:author/:permlink?', (req, res, next) => {
  console.log(' auth', req.session.steemconnect)

  // if(!req.session.steemconnect){
  //   let tag = req.params.tag
  //   let author = req.params.author
  //   let permlink = req.params.permlink
  //   let state = `tag=${tag}&author=${author}&permlink=${permlink}`
  //   let uri = steem.getLoginURL(state);
  //   res.redirect(uri);
  // } else {
  //  logged in
  // }
      let status;
      if(!req.session.steemconnect){
        status = false;
      } else {
        status = true
      }
      let tag = req.params.tag
      let author = req.params.author
      let permlink = req.params.permlink
      let url = `${tag}/${author}/${permlink}`

      res.render('thread', {
        thread: url,
        auth: status,
        tag: tag,
        author: author,
        permlink: permlink
      });
});

router.post('/vote/:author/:permlink/:weight', (req, res, next) => {

  // console.log(' auth', req.session.steemconnect)

    if(req.session.steemconnect) {
      console.log(req.session.steemconnect)
      let voter;
      steem.me((err, steemResponse) => {
        voter =  steemResponse.account.name;
        console.log(voter)
        let author = req.params.author
        let permlink = req.params.permlink
        let weight = parseInt(req.params.weight) * 100
        steem.vote(voter, author, permlink, weight, function (err, steemResponse) {
          if (err) {
            console.log(err)
            res.json({ error: err.error_description })
          } else {
            res.json({ status: 'success' })
          }
        })
      });
  } else {
    res.json({
      status: 'fail',
      message: 'Please Log In'
   })
  }

});

router.post('/comment', (req, res) => {

  if(req.session.steemconnect) {
    let author = req.session.steemconnect.name

    let permlink = req.body.parentPermlink + '-' + util.urlString()
    let title = 'RE: ' + req.body.parentTitle
    let body = req.body.message
    let parentAuthor = req.body.parentAuthor
    let parentPermlink = req.body.parentPermlink


    steem.comment(parentAuthor, parentPermlink, author, permlink, title, body, '', (err, steemResponse) => {
      if (err) {
        console.log(err)
        res.json({
          name: author,
          msg: 'Error'
        })
      } else {
        res.json({
          name: author,
          msg: 'Posted To Steem Network'
        })
      }
    });

  } else {
    res.json({
      status: 'fail',
      message: 'Please Log In'
   })
  }

});



module.exports = router;
