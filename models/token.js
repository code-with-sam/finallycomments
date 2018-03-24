let db = require('../modules/db')

module.exports.findOne = async (username) => {
  return new Promise((resolve, reject) => {
    db.get().db('finally').collection('token').findOne({'username': username }, (error,result) => {
      if(error || result == null) { reject({ error: error }) }
      else { resolve({ error: false, username: result.username, refresh: result.refresh })}
    })
  });
}

module.exports.insert = async (user) => {
  return new Promise((resolve, reject) => {
    db.get().db('finally').collection('token').insertOne(user, (error, response) => {
      if(error || response == null) { reject({ error: error }) }
      else { resolve({ error: false, username: response.username })}
    })
  });
}
