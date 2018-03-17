const MongoClient = require('mongodb').MongoClient;

const url = `mongodb://${process.env.FINALLY_DATABASE_USERNAME}:${process.env.FINALLY_DATABASE_PASSWORD}@ds115799.mlab.com:15799/finally`;
const dbName = 'finally';

let dbClient;
let db;

MongoClient.connect(url, (err, client) => {
  if (err === null){
    console.log(`Connected successfully to Databse: ${dbName}`);
    dbClient = client;
    db = client.db(dbName);
  }
});

module.exports = db;
