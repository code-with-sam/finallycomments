let express = require('express');
let router = express.Router();
let util = require('../modules/util');
let steem = require('../modules/steemconnect')
let db = require('../modules/db')

router.get('/', (req, res, next) =>  {
  res.render('index', {
    css : 'bulma'
  });
});

router.get('/login', (req, res, next) =>  {
  if(req.session.steemconnect){
    res.redirect(`/`)
  } else {
    res.render('index', { title: 'SteemConnect Comments' });
  }
});

router.get('/thread/:tag/:author/:permlink?', (req, res, next) => {
      let status;
      let username;
      let profileImage;
      if(!req.session.steemconnect){
        status = false;
      } else {
        status = true
        if (req.session.steemconnect.json_metadata == '' ||
            req.session.steemconnect.json_metadata == 'undefined' ||
            req.session.steemconnect.json_metadata === undefined ) {
          req.session.steemconnect.meta = { profile_image : '/img/default-user.jpg'}
        } else {
          req.session.steemconnect.meta = req.session.steemconnect.json_metadata ? JSON.parse(req.session.steemconnect.json_metadata).profile : {};
        }

        profileImage = req.session.steemconnect.meta.profile_image ? 'https://steemitimages.com/512x512/' + req.session.steemconnect.meta.profile_image : '';
        console.log(profileImage)
        username = req.session.steemconnect.name
      }


      let tag = req.params.tag
      let author = req.params.author
      let permlink = req.params.permlink
      let url = `${tag}/${author}/${permlink}`

      res.render('thread', {
        path: 'thread',
        username: username || '',
        profileImage: profileImage || '',
        thread: url,
        auth: status,
        tag: tag,
        author: author,
        permlink: permlink
      });
});


router.post('/vote/:author/:permlink/:weight', (req, res, next) => {

    if(req.session.steemconnect) {
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
      message: 'Please sign in to vote.'
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


    steem.comment(parentAuthor, parentPermlink, author, permlink, title, body, { app: 'finally.app' }, (err, steemResponse) => {
      if (err) {
        console.log(err)

        res.json({ error: err.error_description })

      } else {
        res.json({
          name: author,
          msg: 'Posted To Steem Network',
          res: steemResponse
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

router.post('/new-thread', (req, res) => {

  const FINALLY_AUTHOR = 'finallycomments'
  const FINALLY_PERMLINK = 'finally-comments-thread'

  if(req.session.steemconnect) {
    let author = req.session.steemconnect.name
    let permlink = `finally-${util.urlString(8)}`
    let title = req.body.title
    let body = `${title} : This comment is a thread for the Finally Comments System. Visit https://finallycomments.com for more info.`
    let parentAuthor = FINALLY_AUTHOR
    let parentPermlink = FINALLY_PERMLINK

    steem.comment(parentAuthor, parentPermlink, author, permlink, title, body, { app: 'finally.app' }, (err, steemResponse) => {
      if (err) {
        console.log(err)
        res.json({ error: err.error_description })
      } else {

        let thread = {
          author: author,
          slug: permlink,
          title: title
        }
        db.get().db('finally').collection('threads').insertOne(thread, (error, response) => {
          if(error) { res.json({ error: error }) }
          else {
            res.json({
              error: false,
              author: author,
              slug: permlink,
              title: title
            })
          }

        })
      }
    });

  } else {
    res.json({ status: 'fail', message: 'Please Log In'})
  }

  // generate random slug/id



});



module.exports = router;
