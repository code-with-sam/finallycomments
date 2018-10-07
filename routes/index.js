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
const ModerationController = require('../controllers/moderation')
const CustomThreadController = require('../controllers/custom-thread')

router.get('/', (req, res, next) =>  {
  res.render('index');
});

router.get('/about', (req, res, next) =>  {
  res.render('about');
});

router.get('/finally-button', (req, res, next) =>  {
  res.render('finally-button');
});

router.get('/get-started', (req, res, next) =>  {
  res.render('get-started');
});

router.get('/news', (req, res, next) =>  {
  res.render('news');
});

router.get('/post/:permlink', (req, res, next) =>  {
  let permlink = req.params.permlink
  res.render('single-post', { permlink });
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

router.get('/button/:tag/:author/:permlink', (req, res, next) => {
      let status = false
      let tag = req.params.tag
      let author = req.params.author
      let permlink = req.params.permlink
      let username = req.session.steemconnect ? req.session.steemconnect.name : ''
      let url = `${tag}/${author}/${permlink}`
      if(req.session.steemconnect) status = true

      res.render('finally-button-embed', {
        path: 'finally-button-embed',
        thread: url,
        auth: status,
        username, username
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
    let beneficiary = req.body.beneficiary
    let beneficiaryWeight = parseInt(req.body.beneficiaryWeight) > 40 ? 40 : parseInt(req.body.beneficiaryWeight)

    let commentParams = {
      parent_author: parentAuthor,
      parent_permlink: parentPermlink,
      author: author,
      permlink: permlink,
      title: title,
      body: body,
      json_metadata : JSON.stringify({ app: 'finally.app' })
    }
    let beneficiaries = [];
    beneficiaries.push({
      account: beneficiary,
      weight: 100*beneficiaryWeight
    });
    let commentOptionsParams = {
      author: author,
      permlink: permlink,
      max_accepted_payout: '100000.000 SBD',
      percent_steem_dollars: 10000,
      allow_votes: true,
      allow_curation_rewards: true,
      extensions: [
        [0, {
          beneficiaries: beneficiaries
        }]
      ]
    }

    let operations = [['comment', commentParams], ['comment_options', commentOptionsParams]]
    steem.broadcast(operations, (err, steemResponse) => {
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
      rootCategory: req.body.rootCategory,
      rootAuthor: req.body.rootAuthor,
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
      rootCategory: req.body.rootCategory,
      rootAuthor: req.body.rootAuthor,
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


router.get('/api/thread/:username/:slug/:beneficiary?/:bweight?', cors(), async (req, res, next) => {
  CustomThreadController.checkAndGenerate(req, res)
});


router.post('/new-thread', util.isAuthorized, (req, res) => {
  const FINALLY_AUTHOR = 'finallycomments'
  const FINALLY_PERMLINK = 'finally-comments-thread'

  steem.setAccessToken(req.session.access_token);

  let commentParams = {
    parent_author: FINALLY_AUTHOR,
    parent_permlink: FINALLY_PERMLINK,
    author: req.session.steemconnect.name,
    permlink: `finally-${util.urlString(8)}`,
    title: req.body.title,
    body: `${req.body.title} : This comment is a thread for the Finally Comments System. Visit https://finallycomments.com for more info.`,
    json_metadata : JSON.stringify({ app: 'finally.app' })
  }

  let beneficiaries = [];
  let commentExtentions = [];

  if(req.body.beneficiary !== ''){
    beneficiaries.push({
      account: req.body.beneficiary,
      weight: 100*parseInt(req.body.beneficiaryWeight)
    });
    commentExtentions = [[0, { beneficiaries: beneficiaries }]]
  }

  let commentOptionsParams = {
    author: commentParams.author,
    permlink: commentParams.permlink,
    max_accepted_payout: '100000.000 SBD',
    percent_steem_dollars: 10000,
    allow_votes: true,
    allow_curation_rewards: true,
    extensions: commentExtentions
  }

  let operations = [['comment', commentParams], ['comment_options', commentOptionsParams]]

  steem.broadcast(operations, async (err, steemResponse) => {
    if (err) { res.json({ error: err.error_description }) }
    else {
      let newThread = { author: commentParams.author, slug:commentParams. permlink, title: commentParams.title }
      let response = await Thread.insert(newThread)
      res.json(response)
    }
  });
});

router.post('/moderation', util.isAuthorized, async (req, res) => {
    ModerationController.checkRequest(req, res)
});

router.get('/moderation/:permlink', async (req, res) => {
  ModerationController.getModeratedCommentsForPermlink(req, res)
});

module.exports = router;
