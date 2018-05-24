const util = require('../modules/util');
const GuestComment = require('../models/guest-comment')
const GuestReplyComment = require('../models/guest-reply-comment')
const Moderation = require('../models/moderation')
const steemjs = require('steem')

module.exports.checkRequest = async (req, res) => {
  let authenticatedUser = req.session.steemconnect.name
  let permlink = req.body.commentPermlink
  let category = req.body.commentCategory
  let author = req.body.commentAuthor
  let isGuestComment =  JSON.parse(req.body.isGuestComment)
  let isGuestReplyComment = JSON.parse(req.body.isGuestReplyComment)
  let moderationType = req.body.moderationType

  let commentDetails = await util.findRootCommentDetails(isGuestComment, isGuestReplyComment, permlink, author, category)
  if (authenticatedUser !== commentDetails.rootAuthor ) return res.json({status: 'fail', error: 'Not Thread Owner'})

  if(moderationType === 'delete'){
    let comment;
    try { if (isGuestComment) comment = await GuestComment.findOneByPermlinkAndUpdateContent(permlink) }
    catch(error){ return res.json({ error }) }

    try { if (isGuestReplyComment) comment = await GuestReplyComment.findOneByPermlinkAndUpdateContent(permlink) }
    catch(error){ return res.json({ error }) }
  }
  const commentRefrence = {
    root_comment: commentDetails.rootPermlink,
    permlink: permlink,
    status: moderationType
  }
  Moderation.insert(commentRefrence)
    .then(() => res.json({status:'success'}))
    .catch(err => res.json({ error: err }))
}

module.exports.getModeratedCommentsForPermlink = async (req, res) => {
  const permlink = req.params.permlink
  const moderation = await Moderation.find(permlink)
  res.json({moderation})
}
