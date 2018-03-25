let db = require('../modules/db')

module.exports.findOne = async (username) => {
  return new Promise((resolve, reject) => {
    db.get().db('finally').collection('domains').findOne({'username': username },{ sort: { _id: -1 }, limit: 1 }, (error,result) => {
      if(result === null ){
        resolve({ error: false, result: false })
      } else if(error) { reject({ error: error }) }
      else { resolve({ error: false, result: result, list: result.domains })}
    })
  });
}

module.exports.findOneAndUpdate = async (username, data) => {
  return new Promise((resolve, reject) => {
    db.get().db('finally').collection('domains').findOneAndUpdate({'username': username }, data, (error,result) => {
      if(error || result == null) { reject({ error: error }) }
      else { resolve({ error: false, result: result }) }
    })
  });
}

module.exports.insertOne = async (domainList) => {
  return new Promise((resolve, reject) => {
    db.get().db('finally').collection('domains').insertOne(domainList, (error, result) => {
      if(error || result  == null) { reject({ error: error }) }
      else { resolve({ error: false,  result: result })}
    })
  });
}
