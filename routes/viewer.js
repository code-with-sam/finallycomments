let express = require('express');
let router = express.Router();

router.get('/steem-post/:tag/:author/:permlink', (req, res, next) =>  {
  let tag = req.params.tag
  let author = req.params.author
  let permlink = req.params.permlink
  let url = `${tag}/${author}/${permlink}`
  res.render('viewer', {
    url : url,
    generated: false
  });
});

router.get('/custom-thread/:tag/:author/:permlink', (req, res, next) =>  {
  let tag = req.params.tag
  let author = req.params.author
  let permlink = req.params.permlink
  let url = `${tag}/${author}/${permlink}`
  res.render('viewer', {
    url : url,
    generated: true
  });
});

module.exports = router;
