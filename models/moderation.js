let db = require('../modules/db')

module.exports.find = async (permlink) => {
  return new Promise((resolve, reject) => {
    db.get().db('finally').collection('moderation').find({'root_comment': permlink}).toArray( (error, result) => {
      if(error) { reject({ error: error }) }
      else { resolve(result)}
    });
  });
}

module.exports.insert = async (commentRefrence) => {
  try {
    let response = await db.get().db('finally').collection('moderation').insertOne(commentRefrence)
    return { error: false, username: response.username }
  } catch(error){ return { error } }
}
