let db = require('../modules/db')

module.exports.find = async (username) => {
  return new Promise((resolve, reject) => {
    db.get().db('finally').collection('threads').find({'author': username}).toArray( (error, result) => {
      if(error || result == null) { reject({ error: error }) }
      else { resolve(result.reverse()) }
    });
  });
}

module.exports.insert = async (thread) => {
  return new Promise((resolve, reject) => {
    db.get().db('finally').collection('threads').insertOne(thread, (error, response) => {
      if(error || response == null) { reject({ error: error }) }
      else {
        resolve({
          error: false,
          author: thread.author,
          slug: thread.slug,
          title: thread.title })
        }
    })
  });
}
