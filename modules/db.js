const MongoClient = require('mongodb').MongoClient;

// const url = `mongodb://${process.env.FINALLY_DATABASE_USERNAME}:${process.env.FINALLY_DATABASE_PASSWORD}@ds115799.mlab.com:15799/finally`;
// const dbName = 'finally';

let state = {
  db: null
}

module.exports.connect = (url, done) => {
  if (state.db) return done()

  MongoClient.connect(url, (err, db) => {
    if (err) return done(err)
    state.db = db
    done()
  })
}

module.exports.get = () => {
  return state.db
}

module.exports.close = (done) => {
  if (state.db) {
    state.db.close((err, result) => {
      state.db = null
      state.mode = null
      done(err)
    })
  }
}
