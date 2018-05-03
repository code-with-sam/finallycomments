let db = require('../modules/db')

module.exports.insert = async (comment) => {
  return new Promise((resolve, reject) => {
    db.get().db('finally').collection('guest-comments').insertOne(comment, (error, response) => {
      if(error || response == null) { reject({ error }) }
      else { resolve({ error: false, comment}) }
    })
  });
}
