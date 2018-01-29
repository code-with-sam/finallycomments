let express = require('express');
let router = express.Router();

/* GET home page. */
// router.get('/:thread?', (req, res, next) =>  {
//   let thread = req.params.thread
//
//   if(req.session.steemconnect){
//     res.redirect(`/thread/${thread}`)
//   } else {
//     res.render('index', { title: 'SteemConnect Comments' });
//   }
// });

router.get('/thread/:tag/:author/:permlink?', (req, res, next) => {
      let tag = req.params.tag
      let author = req.params.author
      let permlink = req.params.permlink
      let url = `${tag}/${author}/${permlink}`
      console.log()
      res.render('thread', {
        thread: url
      });
});

module.exports = router;
