let express = require('express');
let router = express.Router();
let util = require('../modules/util');
let cors = require('cors')
let { steem, getAccessFromRefresh } = require('../modules/steemconnect')
const Thread = require('../models/thread')
const Domain = require('../models/domain')
const Token = require('../models/token')

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
          res: steemResponse
        })
      }
    });
});

router.get('/api/thread/:username/:slug', cors(), async (req, res) => {
  let username = req.params.username
  let slug = req.params.slug
  let thread;

  try { thread = await Thread.findBySlugAndUser(slug, username) } catch(error){console.log(error)}
  if(thread.result){
    console.log(thread)
    console.log('THREAD FOUND')
    res.redirect(`/thread/finallycomments/@${username}/${slug}`)
    res.next()
  }

  let origin = req.headers.origin
  let referer = req.headers.referer
  let refererLessSlash = referer.slice(0, -1)
  conssole.log('refer less ', refererLessSlash)
  console.log('headers', req.headers)
  let domains = await Domain.findOne(username)
  console.log('domains', domains.list)
  console.log(domains.list.indexOf(origin))

  if (domains.list.indexOf(referer) > -1 || domains.list.indexOf(refererLessSlash) > -1 ){
    let newToken = await getAccessFromRefresh(username)
    steem.setAccessToken(newToken.access_token);
    console.log('token from api call to steemconnect', newToken)
    const FINALLY_AUTHOR = 'finallycomments'
    const FINALLY_PERMLINK = 'finally-comments-thread'
    let author = username
    let permlink = `finally-${slug}`
    let title = `${username}: Finally Thread`
    let body = `${username} : This comment is a thread for the Finally Comments System. Visit https://finallycomments.com for more info.`
    let parentAuthor = FINALLY_AUTHOR
    let parentPermlink = FINALLY_PERMLINK

    steem.comment(parentAuthor, parentPermlink, author, permlink, title, body, { app: 'finally.app' }, async (err, steemResponse) => {
      if (err) {
        console.log(err)
        res.redirect('/404')
      }
      else {
        let newThread = { author: author, slug: permlink, title: title }
        let response = await Thread.insert(newThread)
        res.redirect(`/thread/finallycomments/@${username}/${slug}`)
      }
    });

  } else {
    res.redirect('/404')
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

module.exports = router;
