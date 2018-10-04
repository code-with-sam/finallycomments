const Thread = require('../models/thread')
const Domain = require('../models/domain')
const { steem, getAccessFromRefresh } = require('../modules/steemconnect')
const { URL } = require('url');
const FINALLY_AUTHOR = 'finallycomments'
const FINALLY_PERMLINK = 'finally-comments-thread'

async function createThread(req, res) {
  const params = req.params
  if(params.beneficiary && params.bweight){
    newThreadWithBeneficiary(params.username, params.beneficiary, params.bweight, params.slug, res)
  } else {
    newThread(params.username, params.slug, res)
  }
}

async function newThread(username, slug, res) {
  let newToken;
  try { newToken = await getAccessFromRefresh(username) }
  catch(error){console.log(error)}
  steem.setAccessToken(newToken.access_token);
  let permlink = `finally-${slug}`
  let title = `${username}: Finally Thread`
  let body = `${username} : This comment is a thread for the Finally Comments System. Visit https://finallycomments.com for more info.`
  steem.comment(FINALLY_AUTHOR, FINALLY_PERMLINK, username, permlink, title, body, { app: 'finally.app' }, async (err, steemResponse) => {
    if (err) { console.log(err); res.redirect('/404');
    } else {
      await Thread.insert({ author: username, slug: permlink, title: title })
      res.redirect(`/thread/finallycomments/@${username}/${permlink}`)
    }
  });
}

async function newThreadWithBeneficiary(username, beneficiary, beneficiaryWeight, slug, res) {
  let newToken;
  try { newToken = await getAccessFromRefresh(username) }
  catch(error){console.log(error)}
  steem.setAccessToken(newToken.access_token);

  let author = username
  let permlink = `finally-${slug}`
  let title = `${username}: Finally Thread`
  let body = `${username} : This comment is a thread for the Finally Comments System. Visit https://finallycomments.com for more info.`
  let parentAuthor = FINALLY_AUTHOR
  let parentPermlink = FINALLY_PERMLINK
  let beneficiaryWeight = parseInt(beneficiaryWeight) > 40 ? 40 : parseInt(beneficiaryWeight)

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
  steem.broadcast(operations, async (err, steemResponse) => {
    if (err) { console.log(err); res.redirect('/404');
    } else {
      await Thread.insert({ author: author, slug: permlink, title: title })
      res.redirect(`/thread/finallycomments/@${username}/${permlink}`)
    }
  });

}

module.exports.checkAndGenerate = async (req, res) => {
  let username = req.params.username
  let sluglink = `finally-${req.params.slug}`
  let thread;
  try { thread = await Thread.findBySlugAndUser(sluglink, username) } catch(error){console.log(error)}
  if(thread.result){
    res.redirect(`/thread/finallycomments/@${username}/${sluglink}`)
  } else {
    if(req.headers.referer === undefined) res.redirect('/404')
    let referer = new URL(req.headers.referer)
    let domains = await Domain.findOne(username)
    if (domains.list.indexOf(referer.host) > -1 ) {
      createThread(req, res)
    } else { res.redirect('/404') }
  }
}
