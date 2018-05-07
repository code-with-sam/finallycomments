let db = require('../modules/db')

module.exports.insert = async (comment) => {
  return new Promise((resolve, reject) => {
    db.get().db('finally').collection('guest-reply-comments').insertOne(comment, (error, response) => {
      if(error || response == null) { reject({ error }) }
      else { resolve({ error: false, comment}) }
    })
  });
}

module.exports.find = async (permlink) => {
  return new Promise((resolve, reject) => {
    db.get().db('finally').collection('guest-reply-comments').find({'root_comment': permlink}).toArray( (error, result) => {
      if(error) { reject({ error: error }) }
      else {
        console.log('result from custom search: ', result)
        resolve(result)
      }
    });
  });
}
