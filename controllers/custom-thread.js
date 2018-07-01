const Thread = require('../models/thread')
const Domain = require('../models/domain')
const { URL } = require('url');

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
    if (domains.list.indexOf(referer.host) > -1 ){
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
}
