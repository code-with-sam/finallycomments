const Thread = require('../models/thread')
const Domain = require('../models/domain')
const { steem, getAccessFromRefresh } = require('../modules/steemconnect')
const { URL } = require('url');
const FINALLY_AUTHOR = 'finallycomments'
const FINALLY_PERMLINK = 'finally-comments-thread'

async function createThread(username) {
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
      await Thread.insert({ author: author, slug: permlink, title: title })
      res.redirect(`/thread/finallycomments/@${username}/${permlink}`)
    }
  });
}

module.exports.checkAndGenerate = async (req, res) => {
  let username = req.params.username
  let slug = req.params.slug
  let sluglink = `finally-${slug}`
  let thread;
  try { thread = await Thread.findBySlugAndUser(sluglink, username) } catch(error){console.log(error)}
  if(thread.result){
    res.redirect(`/thread/finallycomments/@${username}/${sluglink}`)
  } else {
    if(req.headers.referer === undefined) res.redirect('/404')
    let referer = new URL(req.headers.referer)
    let domains = await Domain.findOne(username)
    if (domains.list.indexOf(referer.host) > -1 ) {
      createThread(username)
    } else { res.redirect('/404') }
  }
}
