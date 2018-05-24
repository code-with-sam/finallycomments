let express = require('express');
let router = express.Router();
let util = require('../modules/util');
let cors = require('cors')
let { steem, getAccessFromRefresh } = require('../modules/steemconnect')
const Thread = require('../models/thread')
const Domain = require('../models/domain')
const Token = require('../models/token')
const GuestComment = require('../models/guest-comment')
const GuestReplyComment = require('../models/guest-reply-comment')
const Moderation = require('../models/moderation')
const steemjs = require('steem')

router.get('/', (req, res, next) =>  {
  res.render('index', {
    css : 'bulma'
  });
});

router.get('/thread/:tag/:author/:permlink', (req, res, next) => {
      let status = false
      let username = req.session.steemconnect ? req.session.steemconnect.name : ''
      let profileImage = '/img/default-user.jpg'
      let tag = req.params.tag
      let author = req.params.author
      let permlink = req.params.permlink
      let url = `${tag}/${author}/${permlink}`

      if(req.session.steemconnect){
        status = true
        profileImage = util.processProfileImage(req.session.steemconnect)
      }
      res.render('thread', {
        path: 'thread',
        username: username,
        profileImage: profileImage,
        thread: url,
        auth: status,
        tag: tag,
        author: author,
        permlink: permlink
      });
});

router.post('/vote/:author/:permlink/:weight', util.isAuthorized, (req, res, next) => {
    steem.setAccessToken(req.session.access_token);
    let voter = req.session.steemconnect.name;
    let author = req.params.author
    let permlink = req.params.permlink
    let weight = parseInt(req.params.weight) * 100
    steem.vote(voter, author, permlink, weight, (err, steemResponse) => {
      if (err) {
        res.json({ error: err.error_description })
      } else {
        res.json({ status: 'success', message: `${weight/100}% Vote from @${voter} to @${author} for ${permlink}` })
      }
    })
});

router.post('/comment', util.isAuthorized, (req, res) => {
    steem.setAccessToken(req.session.access_token);
    let author = req.session.steemconnect.name
    let permlink = req.body.parentPermlink + '-' + util.urlString(32)
    let title = 'RE: ' + req.body.parentTitle
    let body = req.body.message
    let parentAuthor = req.body.parentAuthor
    let parentPermlink = req.body.parentPermlink
    steem.comment(parentAuthor, parentPermlink, author, permlink, title, body, { app: 'finally.app' }, (err, steemResponse) => {
      if (err) {
        res.json({ error: err.error_description })
      } else {
        res.json({
          name: author,
          msg: 'Posted To Steem Network',
          data: steemResponse
        })
      }
    });
});

router.post('/guest-reply-comment', util.isAuthorized, (req, res) => {
    steem.setAccessToken(req.session.access_token);
    let comment = {
      postid: util.urlString(32),
      title: 'RE: ' + req.body.parentTitle,
      author: req.session.steemconnect.name,
      body: req.body.commentBody,
      permlink: req.body.parentPermlink + '_' + util.urlString(32),
      depth: req.body.depth,
      root_comment: req.body.rootComment,
      parent_permlink: req.body.parentPermlink,
      created: new Date().toISOString(),
      votes: 0,
      voters: [],
      value: 0
    }

    GuestReplyComment.insert(comment)
      .then(dbResponse => {
        res.json({ data: {result : dbResponse} })
      })
      .catch(err => res.json({ error: err }))
});

router.post('/guest-comment', (req, res) => {
    let comment = {
      postid: util.urlString(32),
      title: 'RE: ' + req.body.parentTitle,
      author: req.body.author,
      body: req.body.commentBody,
      permlink: req.body.parentPermlink + '_' + util.urlString(32),
      depth: req.body.depth,
      root_comment: req.body.rootComment,
      parent_permlink: req.body.parentPermlink,
      created: new Date().toISOString(),
      votes: 0,
      voters: [],
      value: 0
    }

    GuestComment.insert(comment)
      .then(dbResponse => {
        res.json({ data: {result : dbResponse} })
      })
      .catch(err => res.json({ error: err }))
});

router.post('/guest-comments', async (req, res) => {
    let permlink = req.body.permlink
    let guestComments = await GuestComment.find(permlink)
    res.json({guestComments})
});

router.post('/guest-reply-comments', async (req, res) => {
    let permlink = req.body.permlink
    let guestReplyComments = await GuestReplyComment.find(permlink)
    res.json({guestReplyComments})
});


router.get('/api/thread/:username/:slug', cors(), async (req, res, next) => {
  let username = req.params.username
  let slug = req.params.slug
  let sluglink = `finally-${slug}`
  let thread;
  try { thread = await Thread.findBySlugAndUser(sluglink, username) } catch(error){console.log(error)}
  if(thread.result){
    res.redirect(`/thread/finallycomments/@${username}/${sluglink}`)
  } else {
    let origin = req.headers.origin
    let referer = req.headers.referer
    let refererLessSlash = referer.slice(0, -1)
    let domains = await Domain.findOne(username)

    if (domains.list.indexOf(referer) > -1 || domains.list.indexOf(refererLessSlash) > -1 ){
      let newToken
      try { newToken = await getAccessFromRefresh(username) }
      catch(error){console.log(error)}
      steem.setAccessToken(newToken.access_token);
      const FINALLY_AUTHOR = 'finallycomments'
      const FINALLY_PERMLINK = 'finally-comments-thread'
      let author = username
      let permlink = `finally-${slug}`
      let title = `${username}: Finally Thread`
      let body = `${username} : This comment is a thread for the Finally Comments System. Visit https://finallycomments.com for more info.`
      let parentAuthor = FINALLY_AUTHOR
      let parentPermlink = FINALLY_PERMLINK
      steem.comment(parentAuthor, parentPermlink, author, permlink, title, body, { app: 'finally.app' }, async (err, steemResponse) => {
        if (err) { console.log(err); res.redirect('/404');
        } else {
          let newThread = { author: author, slug: permlink, title: title }
          let response = await Thread.insert(newThread)
          res.redirect(`/thread/finallycomments/@${username}/${permlink}`)
        }
      });
    } else { res.redirect('/404') }
  }

});

router.post('/new-thread', util.isAuthorized, (req, res) => {
  const FINALLY_AUTHOR = 'finallycomments'
  const FINALLY_PERMLINK = 'finally-comments-thread'

  steem.setAccessToken(req.session.access_token);
  let author = req.session.steemconnect.name
  let permlink = `finally-${util.urlString(8)}`
  let title = req.body.title
  let body = `${title} : This comment is a thread for the Finally Comments System. Visit https://finallycomments.com for more info.`
  let parentAuthor = FINALLY_AUTHOR
  let parentPermlink = FINALLY_PERMLINK

  steem.comment(parentAuthor, parentPermlink, author, permlink, title, body, { app: 'finally.app' }, async (err, steemResponse) => {
    if (err) { res.json({ error: err.error_description }) }
    else {
      let newThread = { author: author, slug: permlink, title: title }
      let response = await Thread.insert(newThread)
      res.json(response)
    }
  });
});

router.post('/moderation', util.isAuthorized, async (req, res) => {
  steem.setAccessToken(req.session.access_token);
  let authenticatedUser = req.session.steemconnect.name
  let rootPermlink;

  if (req.body.isGuestComment) {
    let guestComment = await GuestComment.findOneByPermlink(permlink)
    rootPermlink = guestComment.result.root_comment
  }
  else if (req.body.isGuestReplyComment) {
    let guestReplyComments = await GuestReplyComment.findOneByPermlink(permlink)
    rootPermlink = guestReplyComments.result.root_comment
  }
  else {
    const permlinkState = await steemjs.api.getStateAsync(`/${req.body.commentCategory}/@${req.body.commentAuthor}/${req.body.commentPermlink}`)
    const rootAuthor = Object.values(permlinkState.content)[0].root_author
    let rootPermlink = Object.values(permlinkState.content)[0].root_permlink
  }
  if (authenticatedUser !==  rootAuthor ) return res.json({status: 'fail', error: 'Not Thread Owner'})

  const commentRefrence = {
    root_comment: rootPermlink,
    permlink: permlink,
    status: 'hide'
  }
  Moderation.insert(commentRefrence)
      .then(() => res.json({status:'success'}))
      .catch(err => res.json({ error: err }))
});

router.get('/moderation/:permlink', async (req, res) => {
    const permlink = req.params.permlink
    const moderation = await Moderation.find(permlink)
    res.json({moderation})
});

module.exports = router;
