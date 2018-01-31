
  const steemComments = {
    CATEGORY: '',
    AUTHOR: '',
    PERMLINK: '',
    STEEMSERVER: 'https://api.steemit.com',
    init: () => {
      steemComments.getPartsFromLink()
      steemComments.addTopBar()
      steemComments.getComments()
      steemComments.uiActions()
    },
    uiActions: () => {

          $('.sc-topbar__upvote').on('click', () => {
            steemComments.addVoteTemplateAfter('.sc-topbar__upvote')
          })

          $('.sc-topbar__reply').on('click', () => {
            steemComments.addCommentTemplateAfter('.sc-section .sc-topbar__rule')
            $('.sc-vote').remove()
          })

          $('.sc-section').on('click', '.sc-item__reply', (e) => {
            steemComments.addCommentTemplateAfter(e.currentTarget)
          })

          $('.sc-section').on('click', '.sc-item__upvote', (e) => {
            steemComments.addVoteTemplateAfter(e.currentTarget)
          })

          $('.sc-section').on('input', '.sc-vote__slider', (e) => {
            let weight = $('.sc-vote__slider').val()
            $('.sc-vote__value').text(weight + '%')
          })

          $('.sc-section').on('click', '.sc-vote__btn', (e) => {
            console.log('vote')
            let topLevel = $(e.currentTarget).parent().parent().parent().hasClass('sc-section') ? true : false
            let weight = $('.sc-vote__slider').val()
            let permlink = topLevel ? steemComments.PERMLINK : $(e.currentTarget).closest('.sc-item').data('permlink')
            let author = topLevel ? steemComments.AUTHOR : $(e.currentTarget).closest('.sc-item').data('author')
            $('.sc-vote__value').text(weight + '%')
            steemComments.sendVote(author, permlink, weight)
          })

          // $('.sc-section').on('keyup', '.sc-comment__username',(e) => {
          //   let topLevel = $(e.currentTarget).parent().parent().hasClass('sc-section') ? true : false
          //   let username = $('.sc-comment__username').val().trim()
          //   let message = $('.sc-comment__message').val()
          //   let parentPermlink = topLevel ? steemComments.PERMLINK : $(e.currentTarget).closest('.sc-item').data('permlink')
          //   let parentAuthor = topLevel ? steemComments.AUTHOR : $(e.currentTarget).closest('.sc-item').data('author')
          //   let title = topLevel ? '@'+parentAuthor : $(e.currentTarget).closest('.sc-item').data('title')
          //   steemComments.setCommentUrl(parentAuthor,parentPermlink, username, message, title)
          // })

          $('.sc-section').on('click', '.sc-comment__btn' , (e) => {
            e.preventDefault()
            let topLevel = $(e.currentTarget).parent().parent().hasClass('sc-section') ? true : false
            let message = $('.sc-comment__message').val()
            let parentPermlink = topLevel ? steemComments.PERMLINK : $(e.currentTarget).closest('.sc-item').data('permlink')
            let parentAuthor = topLevel ? steemComments.AUTHOR : $(e.currentTarget).closest('.sc-item').data('author')
            let title = topLevel ? '@'+parentAuthor : $(e.currentTarget).closest('.sc-item').data('title')
            steemComments.sendComment(parentAuthor,parentPermlink, message, title)
          })

          $('.sc-section').on('click', '.sc-comment__close, .sc-vote__close', (e) => {
            $(e.currentTarget).parent().remove()
          });

          // $('.sc-section').on('click', '.sc-comment__btn, .sc-vote__btn', (e) => {
          //   setTimeout(() => {
          //     let inputArea = $(e.currentTarget).parent()
          //       inputArea.fadeOut(400, (e)=> {
          //         inputArea.remove()
          //         $('.sc-comments').remove()
          //         steemComments.getComments()
          //       })
          //   }, 3000)
          //
          // })

          // $('.sc-section').on('click', '.sc-comment__btn', (e) => {
          //   let url = $(e.currentTarget).attr('href');
          //   let newWindow = window.open(url,'steemconnect','height=650,width=770')
          //   if (window.focus)
          //     newWindow.focus()
          //
          //   e.preventDefault()
          //   return false;
          // })

    },
    getPartsFromLink: () => {
      let url = $('.sc-section').data('steemlink')
      let lastChar = url.substr(url.length -1);
      if (lastChar === '/')
      url = url.slice(0, -1);

      let parts = url.split('/')
      console.log(parts)

      steemComments.PERMLINK = parts.pop();
      steemComments.AUTHOR = parts.pop().substr(1);
      steemComments.CATEGORY = parts.pop();
    },
    addTopBar: () => {
      let template = `
          <div class="sc-topbar sc-cf">
            <span class="sc-topbar__upvote">
            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            viewBox="0 0 50 50" width="22px" height="22px">
            <circle fill="transparent" stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st0" cx="25" cy="25" r="23"/>
            <line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st1" x1="13.6" y1="30.6" x2="26" y2="18.2"/>
            <line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st2" x1="36.4" y1="30.6" x2="24" y2="18.2"/>
            </svg>
            </span>
            <span class="sc-topbar__reply">Reply</span>

            <span class="sc-topbar__count"> 00 Comments</span>

          </div>
          <hr class="sc-topbar__rule">`
      $('.sc-section').append(template)
    },
    addCommentTemplateAfter: (dest) => {
      $('.sc-comment__container').remove()
      let template = `<div class="sc-comment__container">
      <textarea class="sc-comment__message" placeholder="Reply"></textarea>
      <a href="#" target="_blank" class="sc-comment__btn">Post</a>
      <span class="sc-close sc-comment__close" >Cancel</span>
      </div>`
      $(template).insertAfter(dest)
      $(dest).next().children('textarea').focus()
    },
    addVoteTemplateAfter: (dest) => {
      $('.sc-vote').remove()
      let template = `<div class="sc-vote">
      <span class="sc-vote__btn">
      <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 50 50" width="30px" height="30px">
      <circle fill="transparent" stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st0" cx="25" cy="25" r="23"/>
      <line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st1" x1="13.6" y1="30.6" x2="26" y2="18.2"/>
      <line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st2" x1="36.4" y1="30.6" x2="24" y2="18.2"/>
      </svg>
      </span>
      <span class="sc-vote__value">50%</span>
      <input type="range" min="1" max="100" value="50" class="sc-vote__slider" id="myRange">
      <span class="sc-close sc-vote__close" >&#43;</span>
      </div>`
      $(template).insertAfter(dest)
    },
    sendVote: ( author, permlink, weight) => {
          $.post({
            url: `/vote/${author}/${permlink}/${weight}`
          }, (response) => {
            if (response.error) {
              console.log('error')
            } else {
              console.log('voted')
            }
          })

    },
    sendComment: (parentAuthor,parentPermlink, message, parentTitle) =>  {
      $.post({
        url: `/comment`,
        dataType: 'json',
        data: {
          parentAuthor: parentAuthor,
          parentPermlink: parentPermlink,
          message: message,
          parentTitle: parentTitle
        }
      }, (response) => {
        if (response.error) {
          console.log('error')
        } else {
          console.log('commented')
        }
      })
    },
    setCommentUrl: (parentAuthor,parentPermlink, author, message, parentTitle) =>  {
      let title = 'RE: ' + parentTitle
      let permlink = steemComments.randomString()
      let steemconnectUrl = encodeURI(`https://v2.steemconnect.com/sign/comment?parent_author=${parentAuthor}&parent_permlink=${parentPermlink}&author=${author}&permlink=${permlink}&title=${title}&body=${message}`)
      $('.sc-comment__btn').attr('href', steemconnectUrl)
    },
    randomString: () => {
      let string = ''
      let allowedChars = "abcdefghijklmnopqrstuvwxyz0123456789";
      for (var i = 0; i < 32; i++){
        string += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
      }
      return string;
    },
    getComments: () => {
      $('.sc-section').append('<div class="sc-comments"></div>')

      steem.api.setOptions({ url: steemComments.STEEMSERVER });
      steem.api.getState(`/${steemComments.CATEGORY}/@${steemComments.AUTHOR}/${steemComments.PERMLINK}`, function(err, result) {
        let resultsArray = [];
        console.log(result);

        for ( post in result.content ){

          var html = result.content[post].body

          resultsArray.push({
            id: result.content[post].id,
            title: result.content[post].root_title,
            author: result.content[post].author,
            body: html,
            permlink: result.content[post].permlink,
            depth: result.content[post].depth,
            root_comment: result.content[post].root_comment,
            parent_permlink: result.content[post].parent_permlink,
            created: result.content[post].created,
            votes: result.content[post].net_votes
          })
        }

        // Sort By Date/ID
        resultsArray = resultsArray.sort((a,b) => {
          return b.id - a.id
        });

        // Find Deepest Comment
        let maxDepthComment = resultsArray.reduce((prev, current) => {
          return (prev.depth > current.depth) ? prev : current
        })

        // Multi demention array by
        let resultsByDepth = [];
        for (var i = 0; i < maxDepthComment.depth + 1; i++) {
          resultsByDepth.push(resultsArray.filter((elem, j, array) => {
            return elem.depth === i;
          }))
        }

        // loop over multi array
        console.log(resultsByDepth);
        resultsByDepth.forEach( (postsAtDepth, i, arr) => {
          console.log(postsAtDepth)
          postsAtDepth.forEach( (post, i, arr) => {
            let template = steemComments.createCommentTemplate(result,post)
            if ( post.depth === 1 ) {
              $('.sc-comments').prepend( template)
            } else if ( post.depth  > 1) {
              var permlink = post.parent_permlink
              $('.' + permlink ).append( template)
            }
          })
        })

        $('.sc-topbar__count').text(`${resultsArray.length} Comments`)
      });
    },
    createCommentTemplate: (result, post) => {
          var permlink = post.parent_permlink

          try {
            var metadata = JSON.parse(result.accounts[post.author].json_metadata).profile
          }
          catch (e){
            var metadata = {profile_image: '/img/default-user.jpg'}
            console.log(e)
          }

          var voteMessage = (post.votes > 1 || post.votes == 0 )? 'votes' : 'vote'
          var template = `
          <div data-post-id="${post.id}"
          data-permlink="${post.permlink}"
          data-author="${post.author}"
          data-title="${post.title}"

          class="sc-item sc-cf sc-item__level-${post.depth} ${post.permlink}">
          <div class="sc-item__left">
          <img class="sc-item__image" src="${metadata.profile_image}" height="50px" width="50px">
          </div>
          <div class="sc-item__right">
          <h4 class="sc-item__username">
          <a class="sc-item__author-link" href="https://steemit.com/@${post.author}" target="_blank">@${post.author}</a>
          <span class="sc-item__middot"> &middot; </span> <span class="sc-item__datetime"> ${ moment(post.created).fromNow() } </span>
          </h4>
          <p class="sc-item__content">${ post.body }...</p>
          <div class="sc-item__meta">
          <span class="sc-item__upvote">
          <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          viewBox="0 0 50 50" width="18px" height="18px">
          <circle fill="transparent" stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st0" cx="25" cy="25" r="23"/>
          <line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st1" x1="13.6" y1="30.6" x2="26" y2="18.2"/>
          <line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st2" x1="36.4" y1="30.6" x2="24" y2="18.2"/>
          </svg>
          </span>
          <span class="sc-item__divider">|</span>
          <span class="sc-item__votecount">${post.votes} ${voteMessage}</span>
          <span class="sc-item__divider">|</span>
          <span class="sc-item__reply">Reply</span>
          </div>
          </div>
          </div>`
          return template;
        }
  }
  steemComments.init()
