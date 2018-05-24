const GuestComment = require('../models/guest-comment')
const GuestReplyComment = require('../models/guest-reply-comment')

module.exports.urlString = (num) => {
    let string = ''
    let allowedChars = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < num ; i++){
      string += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
    }
    return string;
}

module.exports.isAuthenticated = (req, res, next) => {
  if (req.session.steemconnect)
      return next();

  res.redirect('/');
}

module.exports.isAuthorized = (req, res, next) => {
  if (req.session.access_token)
      return next();

  res.json({
    status: 'fail',
    message: 'Please sign in.'
  })
}

module.exports.splitQueryString = (string) => {
   let allParams = string.split('&');

   let map =  allParams.map(value => {
       let item = value.split('=');
       return [item[0], item[1]];
   })

   return map.reduce((obj, item) => {
     obj[item[0]] = item[1]
     return obj
   }, {})
}

module.exports.processProfileImage = (account) => {
  let metaData;
  if (account.json_metadata === '' ||
      account.json_metadata === 'undefined' ||
      account.json_metadata === undefined ) {
      metaData = { profile_image : '/img/default-user.jpg'}
  } else {
    metaData = account.json_metadata ? JSON.parse(account.json_metadata).profile : {};
  }
  return profileImage = metaData.profile_image ? 'https://steemitimages.com/512x512/' + metaData.profile_image : '';
}

// Takes a comment and finds the root author and root permlink

module.exports.findRootCommentDetails = async (isGuestComment, isGuestReplyComment, permlink, author, category) => {
  let rootPermlink, rootAuthor;
  if (isGuestComment) {
    let guestComment = await GuestComment.findOneByPermlink(permlink)
    rootPermlink = guestComment.result.root_comment
    rootAuthor = guestComment.result.rootAuthor
  } else if (isGuestReplyComment) {
    let guestReplyComments = await GuestReplyComment.findOneByPermlink(permlink)
    rootPermlink = guestReplyComments.result.root_comment
    rootAuthor = guestReplyComments.result.rootAuthor
  } else {
    rootAuthor = author
    rootPermlink = permlink
  }
  return {rootAuthor, rootPermlink}
}
