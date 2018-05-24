const steemjs = require('steem')
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
  if (account.json_metadata === '{}') {
      metaData = { profile_image : '/img/default-user.jpg'}
  } else {
    metaData = account.json_metadata ? JSON.parse(account.json_metadata).profile : {};
  }
  return profileImage = metaData.profile_image ? 'https://steemitimages.com/512x512/' + metaData.profile_image : '';
}

// Takes a comment and finds the root author and root permlink

module.exports.findRootCommentDetails = async (isGuestComment, isGuestReplyComment, permlink, rootPostPath) => {
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
    const permlinkState = await steemjs.api.getStateAsync(rootPostPath)
    // check if this is a custom thread by seeing if the get state url has an item of depth 0.
    // if depth 0 exists it must be a STEEM comment
    // custom threads are the first child of finally post so will be min depth of 1
    let isCustomThread =  Object.values(Object.assign(permlinkState.content, {})).filter(post =>  parseInt(post.depth) === 0 ).length >= 1 ? false : true
    if(isCustomThread) {
      let authorPost =  Object.values(Object.assign(permlinkState.content, {})).filter(post =>  parseInt(post.depth) === 1 )[0]
      rootAuthor = authorPost.author
      rootPermlink = authorPost.permlink
    } else {
       rootAuthor = Object.values(permlinkState.content)[0].root_author
       rootPermlink = Object.values(permlinkState.content)[0].root_permlink
    }
  }
  console.log({rootAuthor, rootPermlink})
  return {rootAuthor, rootPermlink}
}
