let db = require('../modules/db')

module.exports.insert = async (thread) => {
  return new Promise((resolve, reject) => {
    db.get().db('finally').collection('threads').insertOne(thread, (error, response) => {
      if(error) { reject({ error: error }) }
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
