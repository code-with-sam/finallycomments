
const steemComments = {
    CATEGORY: '',
    AUTHOR: '',
    PERMLINK: '',
    STEEMSERVER: 'https://api.steemit.com',
    PROFILEIMAGE: '',
    ISAUTHENTICATED: $('.sc-section').data('auth'),
    USERACCOUNTS: [],
    OPTIONS: {},
    upvoteIcon: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 50" width="18px" height="18px"><circle fill="transparent" stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st0" cx="25" cy="25" r="23"/><line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st1" x1="13.6" y1="30.6" x2="26" y2="18.2"/><line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st2" x1="36.4" y1="30.6" x2="24" y2="18.2"/></svg>',
    authenticatedUser: () => {
      if (steemComments.ISAUTHENTICATED){
        return $('.sc-section').data('username');
      } else {
        return false
      }
    },
    init: () => {
      steemComments.getPartsFromLink()
      steemComments.addTopBar()
      steemComments.getComments()
        .then( x => {
          steemComments.getGuestComments(steemComments.PERMLINK)
          steemComments.getGuestReplyComments(steemComments.PERMLINK)
        })
      steemComments.uiActions()
      window.addEventListener('message', steemComments.frameLoad, false);
    },
    setOptions: (data) => {
      steemComments.OPTIONS.reputation = data.reputation === 'false' ? false : true
      steemComments.OPTIONS.values = data.values === 'false' ? false : true
      steemComments.OPTIONS.profile = data.profile === 'false' ? false : true
      steemComments.OPTIONS.generated = data.generated === 'false' ? false : true
      console.log(steemComments.OPTIONS)
    },
    frameLoad: (event) => {
      if (event.data.message == 'finally-frame-load'){
        steemComments.setOptions(event.data)
      }
    },
    uiActions: () => {
          $('.sc-login').on('click', (e) => {
            let authUrl = $(e.currentTarget).attr('href')
            authWindow = window.open(authUrl,'Steemconnect Auth','height=700,width=600');
            if (window.focus) authWindow.focus();
            return false;
          })
          $('.sc-topbar').on('click', '.sc-profile__image', () => {
            let template = `
            <div class="sc-settings sc-settings--active">
              <a class="sc-settings__logout" href="/auth/logout/${steemComments.CATEGORY}/@${steemComments.AUTHOR}/${steemComments.PERMLINK}">Logout</a>
            </div>
            `
            if( $('.sc-settings').hasClass('sc-settings--active') ){
              $('.sc-settings').remove()
            } else {
              $('.sc-profile').append(template);
            }
          })

          $('.sc-topbar__upvote').on('click', () => {
            if ( steemComments.ISAUTHENTICATED && $('.sc-topbar__upvote').hasClass('sc-topbar__upvote--voted-true')){
              $('.sc-comments').prepend(steemComments.notificationTemplate('You have already voted.'))
            } else if ( steemComments.ISAUTHENTICATED ){
              steemComments.addVoteTemplateAfter('.sc-topbar__upvote')
            } else {
              $('.sc-comments').prepend(steemComments.notificationTemplate('Please sign in to vote.'))
            }
          })

          $('.sc-topbar__reply').on('click', () => {
            steemComments.addCommentTemplateAfter('.sc-section .sc-topbar__rule')
            $('.sc-vote').remove()
            $('.sc-notification').remove()
          })

          $('.sc-section').on('click', '.sc-item__reply', (e) => {
              steemComments.addCommentTemplateAfter(e.currentTarget)
              $('.sc-vote').remove()
              $('.sc-notification').remove()
          })

          $('.sc-section').on('click', '.sc-item__upvote', (e) => {
            if ( $(e.currentTarget).hasClass('sc-item__upvote--voted-true') ){
              $(e.currentTarget).closest('.sc-item__right').append(steemComments.notificationTemplate('You have already voted.'))
              steemComments.timeoutNotifications()

              return false
            }
            $('.sc-notification').remove()
            if ( steemComments.ISAUTHENTICATED){
              steemComments.addVoteTemplateAfter(e.currentTarget)
            } else {
              $(e.currentTarget).closest('.sc-item__right').append(steemComments.notificationTemplate('Please sign in to vote.'))
            }
          })

          $('.sc-section').on('input', '.sc-vote__slider', (e) => {
            let weight = $('.sc-vote__slider').val()
            $('.sc-vote__value').text(weight + '%')
          })

          $('.sc-section').on('click', '.sc-vote__btn', (e) => {
            let parentElement = $(e.currentTarget).closest('.sc-item')

            let topLevel = $(e.currentTarget).parent().parent().parent().hasClass('sc-section') ? true : false
            let weight = $('.sc-vote__slider').val()
            let permlink = topLevel ? steemComments.PERMLINK : parentElement.data('permlink')
            let author = topLevel ? steemComments.AUTHOR : parentElement.data('author')
            $('.sc-vote__value').text(weight + '%')
            steemComments.sendVote(parentElement, author, permlink, weight)
          })

          $('.sc-section').on('click', '.sc-comment__btn' , (e) => {
            e.preventDefault()
            let $parentElement = $(e.currentTarget).closest('.sc-item') ||  $('.sc-comments')
            let topLevel = $(e.currentTarget).parent().parent().hasClass('sc-section') ? true : false
            let message = $('.sc-comment__message').val()
            let parentPermlink = topLevel ? steemComments.PERMLINK : $parentElement.data('permlink')
            let parentAuthor = topLevel ? steemComments.AUTHOR : $parentElement.data('author')
            let title = topLevel ? '@'+parentAuthor : $parentElement.data('title')
            let parentDepth = $parentElement.data('post-depth')

            if ( $parentElement.data('guest') ) {
              steemComments.sendGuestReplyComment($parentElement, parentAuthor,parentPermlink, message, title, parentDepth)
            } else {
              steemComments.sendComment($parentElement, parentAuthor,parentPermlink, message, title, parentDepth)
            }
          })

          $('.sc-section').on('click', '.sc-guest-comment__btn' , (e) => {
            e.preventDefault()
              let parentElement = $(e.currentTarget).closest('.sc-item') || $('.sc-comments')
              let topLevel = $(e.currentTarget).parent().parent().hasClass('sc-section') ? true : false
              let message = $('.sc-comment__message').val()
              let parentPermlink = topLevel ? steemComments.PERMLINK : parentElement.data('permlink')
              let parentAuthor = topLevel ? steemComments.AUTHOR : parentElement.data('author')
              let title = topLevel ? '@'+parentAuthor : parentElement.data('title')
              let parentDepth = parentElement.data('post-depth') || 0
              let author = $('.sc-input--guestname').val()

              if (author === '') {
                 $(parentElement).children('.sc-item__right').append(steemComments.notificationTemplate('Name can not be empty'))
              } else {
                console.log(parentElement, parentAuthor,parentPermlink, message, title, parentDepth, author)
                steemComments.sendGuestComment(parentElement, parentAuthor,parentPermlink, message, title, parentDepth, author)
              }
          })

          $('.sc-section').on('click', '.sc-comment__close, .sc-vote__close', (e) => {
            $(e.currentTarget).parent().remove()
          });


          $('.sc-section').on('click', '.sc-item__image--profile-enabled', (e) => {
            $('.sc-item__overlay').remove()
            let item = $(e.currentTarget)
            let username = $(e.currentTarget).data('username')
            let bio = $(e.currentTarget).parent().parent().data('bio')
            let profileImage = $(e.currentTarget).attr('src')
            let accountValue;
            let socialStats;
            steem.formatter.estimateAccountValue(steemComments.USERACCOUNTS[username])
            .then( data => {
              accountValue = data
              steem.api.getFollowCountAsync(username)
              .then( data => {
                socialStats = data

                item.parent().append(`
                  <div class="sc-item__overlay sc-item__overlay--open">
                  <img width="100" height="100" src="${profileImage}">
                  <h3>@${username} [${steem.formatter.reputation(steemComments.USERACCOUNTS[username].reputation)}]</h3>

                  <h4>Posts: ${steemComments.USERACCOUNTS[username].post_count} | Followers: ${socialStats.follower_count} | Following ${socialStats.following_count} </h4>
                  <p class="sc-item__account-value">$${accountValue}</p>
                  <p>${(bio !== 'undefined' ? bio : '')}</p>
                  </div>
                  `)
              })
            })

          });
          $('.sc-section').on('click', (e) => {
                if(!$(e.target).closest('.sc-item__left').length) {
                    $('.sc-item__overlay').remove()
                }
          })

          $('.sc-topbar__sort-order select').on('change', (e) => {
                let order = $(e.currentTarget).val()
                console.log(order)
                steemComments.sortComments(order);
          })

    },
    getPartsFromLink: () => {
      let url = $('.sc-section').data('steemlink')
      let lastChar = url.substr(url.length -1);
      if (lastChar === '/')
      url = url.slice(0, -1);

      let parts = url.split('/')

      steemComments.PERMLINK = parts.pop();
      steemComments.AUTHOR = parts.pop().substr(1);
      steemComments.CATEGORY = parts.pop();
    },
    addTopBar: () => {
      let username = $('.sc-section').data('username')
      let profileImage = $('.sc-section').data('profileimage')
      let authUrl = $('.sc-section').data('auth-url')
      let template = `
          <div class="sc-topbar sc-cf">
            <span class="sc-topbar__upvote">${steemComments.upvoteIcon}</span>
            <span class="sc-topbar__reply">Reply</span>

            <span class="sc-topbar__count"> 00 Comments</span>
            <span class="sc-profile sc-profile--${steemComments.ISAUTHENTICATED}">
              <h3 class="sc-profile__name">${username}</h3>
              <img class="sc-profile__image" src="${profileImage}">
            </span>
            <a href="${authUrl}"" class="sc-login sc-login--topbar sc-login--${steemComments.ISAUTHENTICATED}">Sign In</a>
          </div>
          <hr class="sc-topbar__rule">
          <div class="sc-topbar__sort">
            <span>Sort Order:</span>

          <span class="sc-topbar__sort-order">
            <select>
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
              <option value="top">Top Value</option>
            </select>
          </span>
          </div>
          `
      $('.sc-section').append(template)
    },
    addCommentTemplateAfter: (dest) => {
      $('.sc-comment__container').remove()
      let authUrl = $('.sc-section').data('auth-url')
      let guestPostUI = `<input placeholder="Name" type="text" name="guest-name" class="sc-input sc-input--guestname"><a href="#" target="_blank" class="sc-guest-comment__btn">Post As Guest </a> or <a href="${authUrl}" class="sc-login ">Sign In</a>`
      let postButton =  steemComments.ISAUTHENTICATED ? '<a href="#" target="_blank" class="sc-comment__btn">Post</a>' : guestPostUI
      let template = `<div class="sc-comment__container">
      <textarea class="sc-comment__message" placeholder="Reply"></textarea>
      ${postButton}
      <span class="sc-close sc-comment__close" >Cancel</span>
      </div>`
      $(template).insertAfter(dest)
      $(dest).next().children('textarea').focus()
    },
    addVoteTemplateAfter: (dest) => {
      $('.sc-vote').remove()
      let template = `<div class="sc-vote">
      <span class="sc-vote__btn"><span class="sc-topbar__upvote">${steemComments.upvoteIcon}</span>
      <span class="sc-vote__value">50%</span>
      <input type="range" min="1" max="100" value="50" class="sc-vote__slider" id="myRange">
      <span class="sc-close sc-vote__close" >&#43;</span>
      </div>`
      $(template).insertAfter(dest)
    },
    sendVote: (parentElement, author, permlink, weight) => {

          $.post({
            url: `/vote/${author}/${permlink}/${weight}`
          }, (response) => {
            if (response.error) {
              $(parentElement).find('.sc-vote').remove()
              $(parentElement).children('.sc-item__right').append(steemComments.notificationTemplate(response.error))
            } else {
              if (response.status == 'fail'){
                $(parentElement).find('.sc-vote').remove()
                let msg = 'You have already voted in a similar way'
                if (response.status.includes(msg)){
                  $(parentElement).children('.sc-item__right').append(steemComments.notificationTemplate(msg))

                } else {
                  $(parentElement).children('.sc-item__right').append(steemComments.notificationTemplate('Unknown error, please try again.'))
                }
              } else {
                let count = $(parentElement).find('.sc-item__votecount').first()
                $(parentElement).find('.sc-item__upvote').addClass('sc-item__upvote--voted-true')
                count.text( parseInt( count.text().split(' ')[0] ) + 1 + ' votes')
                $(parentElement).find('.sc-vote').remove()

              }
            }
          })

    },
    sendComment: (parentElement, parentAuthor,parentPermlink, message, parentTitle, parentDepth) =>  {
      let replytoThread = $(parentElement).hasClass('sc-item')
      if( !replytoThread ){
        $('.sc-comment__container').find('.sc-comment__btn').text('Posting... ')
        $('.sc-comment__container').find('.sc-comment__btn').append('<img src="/img/loader.gif">')
        parentElement = $('.sc-comments')
      } else {
        $(parentElement).find('.sc-comment__btn').text('Posting... ')
        $(parentElement).find('.sc-comment__btn').append('<img src="/img/loader.gif">')
      }

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
          $(parentElement).append(steemComments.notificationTemplate('Error posting comment please try again after 20 seconds'))
        } else {
          if (response.status == 'fail'){
            $(parentElement).append(steemComments.notificationTemplate(response.message))
          } else {
            steemComments.appendSuccessfulComment(response, parentDepth, parentElement, true)
          }
        }
      })
    },
    appendSuccessfulComment: (response, parentDepth, parentElement, fromSteem) => {
      let newComment, guestReply = false, guest = false;
      let commentdata = steemComments.processAjaxCommentData(response.data, fromSteem, parentDepth)
      // let newComment =  $(steemComments.singleCommentTemplate(commentdata, parentDepth, fromSteem, steemComments.ISAUTHENTICATED)
      if (!fromSteem && !steemComments.ISAUTHENTICATED) guest = true
      if (!fromSteem && steemComments.ISAUTHENTICATED) guestReply = true
      newComment = $(steemComments.createCommentTemplate(steemComments.USERACCOUNTS, commentdata, false, false, guest, guestReply))
      let inputArea = $('.sc-comment__container')
      inputArea.fadeOut(400, () => inputArea.remove())
      $(parentElement).append(newComment)
      let offset = newComment.offset().top
      parent.postMessage({
        message: 'new-comment',
        inputAreaHeight: 100,
        offset: offset,
        depth: parentDepth || 0
      }, '*')
    },
    sendGuestComment: (parentElement, parentAuthor,parentPermlink, message, parentTitle, parentDepth, author) => {

      let comment = {
        author,
        commentBody: message,
        parentTitle: parentTitle,
        depth: parentDepth + 1 ,
        rootComment: steemComments.PERMLINK,
        parentPermlink: parentPermlink
      }

      let replytoThread = $(parentElement).hasClass('sc-item')
      if( !replytoThread ){
        $('.sc-comment__container').find('.sc-guest-comment__btn').text('Posting... ')
        $('.sc-comment__container').find('.sc-guest-comment__btn').append('<img src="/img/loader.gif">')
        parentElement = $('.sc-comments')
      } else {
        $(parentElement).find('.sc-guest-comment__btn').text('Posting... ')
        $(parentElement).find('.sc-guest-comment__btn').append('<img src="/img/loader.gif">')
      }
      $.post({
        url: `/guest-comment`,
        dataType: 'json',
        data: comment
      }, (response) => {
        if (response.status == 'fail'){
          $(parentElement).append(steemComments.notificationTemplate(response.message))
        } else {
          steemComments.appendSuccessfulComment(response, parentDepth, parentElement, false)
        }
      })
    },
    sendGuestReplyComment: (parentElement, parentAuthor,parentPermlink, message, parentTitle, parentDepth) => {
      let comment = {
        parentAuthor: parentAuthor,
        parentPermlink: parentPermlink,
        commentBody: message,
        parentTitle: parentTitle,
        depth: parentDepth + 1 ,
        rootComment: steemComments.PERMLINK,
      }
      let replytoThread = $(parentElement).hasClass('sc-item')
      if( !replytoThread ){
        $('.sc-comment__container').find('.sc-comment__btn').text('Posting... ')
        $('.sc-comment__container').find('.sc-comment__btn').append('<img src="/img/loader.gif">')
        parentElement = $('.sc-comments')
      } else {
        $(parentElement).find('.sc-comment__btn').text('Posting... ')
        $(parentElement).find('.sc-comment__btn').append('<img src="/img/loader.gif">')
      }
      $.post({
        url: `/guest-reply-comment`,
        dataType: 'json',
        data: comment
      }, (response) => {
        if (response.status == 'fail'){
          $(parentElement).append(steemComments.notificationTemplate(response.message))
        } else {
          steemComments.appendSuccessfulComment(response, parentDepth, parentElement, false)
        }
      })
    },
    getGuestComments: (rootPermlink) => {
      $.post({
        url: '/guest-comments',
        dataType: 'json',
        data: { permlink: rootPermlink }
      }, (response) => {
        steemComments.displayGuestComments(response.guestComments)
      })
    },
    getGuestReplyComments: (rootPermlink) => {
      $.post({
        url: '/guest-reply-comments',
        dataType: 'json',
        data: { permlink: rootPermlink }
      }, (response) => {
        steemComments.displayGuestReplyComments(response.guestReplyComments)
      })
    },
    displayGuestComments: (comments) => {
      comments.forEach( (post, i, arr) => {
        console.log(post)
        let order = post.depth === 1 ? i : false
        let accounts = undefined // no account arry to loop over for guests
        let voted = false
        let template = steemComments.createCommentTemplate(accounts, post, voted, order, true)
        if ( post.depth === 1 ) {
          $('.sc-comments').prepend( template)
        } else if ( post.depth  > 1) {
          $('.' + post.parent_permlink ).append( template)
        }
      })
    },
    displayGuestReplyComments: async (comments) => {
      let authors = comments.map(comment => comment.author)
      let newAccounts = await steem.api.getAccountsAsync(authors)
      newAccounts.forEach(user => steemComments.USERACCOUNTS[user.name] = user )
      comments.forEach( (post, i, arr) => {
        console.log(post)
        let order = post.depth === 1 ? i : false
        let voted = false
        let template = steemComments.createCommentTemplate(steemComments.USERACCOUNTS, post, voted, order, false, true)
        if ( post.depth === 1 ) {
          $('.sc-comments').prepend( template)
        } else if ( post.depth  > 1) {
          $('.' + post.parent_permlink ).append( template)
        }
      })
    },
    getComments: () => {
      return new Promise((resolve, reject) => {
        $('.sc-section').append('<div class="sc-comments"></div>')

        steem.api.getState(`/${steemComments.CATEGORY}/@${steemComments.AUTHOR}/${steemComments.PERMLINK}`, function(err, result) {
          steemComments.USERACCOUNTS = result.accounts
          let resultsArray = [];

          for ( post in result.content ){

            var html = result.content[post].body

            resultsArray.push({
              id: result.content[post].id,
              title: result.content[post].root_title,
              author: result.content[post].author,
              body: html,
              permlink: result.content[post].permlink,
              depth: steemComments.OPTIONS.generated ? result.content[post].depth - 1 : result.content[post].depth ,
              root_comment: result.content[post].root_comment,
              parent_permlink: result.content[post].parent_permlink,
              created: result.content[post].created,
              votes: result.content[post].net_votes,
              voters: result.content[post].active_votes.map(vote => vote.voter),
              value: Math.round(parseFloat(result.content[post].pending_payout_value.substring(0,5)) * 100 + parseFloat(result.content[post].total_payout_value.substring(0,5)) * 100) / 100
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
          resultsByDepth.forEach( (postsAtDepth, i, arr) => {
            postsAtDepth.forEach( (post, i, arr) => {
              let voted = false
              if( steemComments.ISAUTHENTICATED ){
                voted = post.voters.indexOf(steemComments.authenticatedUser()) > -1 ? true : false
              }
              let order = post.depth === 1 ? i : false
              let template = steemComments.createCommentTemplate(result.accounts,post, voted, order)
              if ( post.depth === 1 ) {

                $('.sc-comments').prepend( template)
              } else if ( post.depth  > 1) {
                var permlink = post.parent_permlink
                $('.' + permlink ).append( template)
              }
            })
          })

          $('.sc-topbar__count').text(`${resultsArray.length - 1} Comments`)
          if( steemComments.ISAUTHENTICATED ){
            let topLevelPost = resultsArray[resultsArray.length -1]
            voted = topLevelPost.voters.indexOf(steemComments.authenticatedUser()) > -1 ? true : false
            $('.sc-topbar__upvote').addClass(`sc-topbar__upvote--voted-${voted}`)
          }
          resolve()
        });
      });
    },
    createCommentTemplate: (accounts, post, voted, order, guest, guestReply) => {
          var permlink = post.parent_permlink
          var converter = new showdown.Converter();
          var html = converter.makeHtml(post.body);;

          try {
            var metadata = JSON.parse(accounts[post.author].json_metadata).profile
          }
          catch (err){
            var metadata = {profile_image: '/img/default-user.jpg'}
          }

          var voteMessage = (post.votes > 1 || post.votes == 0 )? 'votes' : 'vote'
          var voteValue = (post.value > 0) ? '</span> <span class="sc-item__divider">|</span> <span class="sc-item__votecount">$' + post.value  + '</span><span class="sc-item__votecount">': ''
          var reputation = guest ? '' :`<span class="sc-item__reputation">[${steem.formatter.reputation(steemComments.USERACCOUNTS[post.author].reputation)}]</span>`
          let authorLink = guest ? `<span class="sc-item__author-link">${post.author} (Guest)</span>` : `<a class="sc-item__author-link" href="https://steemit.com/@${post.author}" target="_blank">@${post.author}</a>`
          let upvote = `<span class="sc-item__upvote sc-item__upvote--voted-${voted}">${steemComments.upvoteIcon}</span>
                    <span class="sc-item__divider">|</span>
                    <span class="sc-item__votecount">${post.votes} ${voteMessage} ${ steemComments.OPTIONS.values ? voteValue : ''}</span>
                    <span class="sc-item__divider">|</span>
                    `
          if (guest || guestReply) upvote = ''

          var template = `
          <div data-post-id="${post.id}"
          data-permlink="${post.permlink}"
          data-author="${post.author}"
          data-title="${post.title}"
          data-post-depth="${post.depth}"
          data-bio="${metadata.about}"
          data-order="${order}"
          data-value="${post.value}"
          data-guest="${guest ? true : false }"

          class="sc-item sc-cf sc-item__level-${post.depth} ${post.permlink}">

          <div class="sc-item__left">
          <img class="sc-item__image ${ steemComments.OPTIONS.profile ? 'sc-item__image--profile-enabled' : '' }" data-username="${post.author}" src="${metadata.profile_image}" height="50px" width="50px" onerror="this.src='/img/default-user.jpg'">
          </div>
          <div class="sc-item__right">
          <h4 class="sc-item__username">
          ${authorLink}
          ${steemComments.OPTIONS.reputation ? reputation : ''}

          <span class="sc-item__middot"> &middot; </span> <span class="sc-item__datetime"> ${ moment(post.created).fromNow() } </span>
          </h4>
          <p class="sc-item__content">${ html }</p>
          <div class="sc-item__meta">
          ${upvote}
          <span class="sc-item__reply">Reply</span>
          </div>
          </div>
          </div>`
          return template;
        },
      processAjaxCommentData: (data, fromSteem, parentDepth) => {
          var post = {}, metadata;
          if (fromSteem) {
            data = data.result.operations[0][1]
            metadata = { profile_image: $('.sc-section').data('profileimage') }
          } else {
            data = data.result.comment
            metadata = { profile_image: '/img/default-user.jpg' }
          }
          post.permlink = data.permlink,
          post.author = data.author,
          post.title = data.title,
          post.body = data.body,
          post.depth = parentDepth + 1

          return post
      },
      notificationTemplate: (message) => {
        $('.sc-notification').remove()
        let template = `<div class="sc-notification">${message}</div>`
        return template;
      },
      timeoutNotifications: () => {
        setTimeout(() => {
          let n = $('.sc-notification')
            n.fadeOut(400, (e)=> {
              n.remove()
            })
        }, 3000)
      },
      sortComments: (order) => {
        let $comments = $('*[data-post-depth="1"]')
        let newest = (a,b) => {
          var a = a.getAttribute('data-order')
          var b = b.getAttribute('data-order')
          return a - b
        }
        let oldest = (a,b) => {
          var a = a.getAttribute('data-order')
          var b = b.getAttribute('data-order')
          return  b - a
        }
        let top = (a,b) => {
          var a = a.getAttribute('data-value')
          var b = b.getAttribute('data-value')
          return b - a
        }

        if( order === 'newest') {
          $comments.sort(newest);
        } else if (order === 'oldest'){
          $comments.sort(oldest);
        } else if (order === 'top'){
          $comments.sort(top);
        }
        $comments.detach().appendTo('.sc-comments');
      }
  }
  steemComments.init()
