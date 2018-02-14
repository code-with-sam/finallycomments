
const steemComments = {
    CATEGORY: '',
    AUTHOR: '',
    PERMLINK: '',
    STEEMSERVER: 'https://api.steemit.com',
    PROFILEIMAGE: '',
    ISAUTHENTICATED: $('.sc-section').data('auth'),
    USERACCOUNTS: [],
    OPTIONS: {},
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
      steemComments.uiActions()
      steemComments.setOptions()
    },
    setOptions: () => {
      console.log(window.frameElement)
      let options = window.frameElement.dataset || {}
      steemComments.OPTIONS.reputation = options.reputation === 'false' ? false : true
      steemComments.OPTIONS.values = options.values === 'false' ? false : true
      steemComments.OPTIONS.profile = options.profile === 'false' ? false : true

    },
    uiActions: () => {
          $('.sc-login').on('click', () => {
            parent.postMessage({
              message: 'sign-in'
            }, '*')

            return true
          })
          $('.sc-topbar').on('click', '.sc-profile__image', () => {
            let template = `
            <div class="sc-settings sc-settings--active">
              <a class="sc-settings__logout" href="/auth/logout">Logout</a>
            </div>
            `
            if( $('.sc-settings').hasClass('sc-settings--active') ){
              $('.sc-settings').remove()
            } else {
              $('.sc-profile').append(template);
            }
          })

          $('.sc-topbar__upvote').on('click', () => {
            if ( steemComments.ISAUTHENTICATED){
              steemComments.addVoteTemplateAfter('.sc-topbar__upvote')
            } else {
              $('.sc-comments').prepend(steemComments.notificationTemplate('Please sign in to vote.'))
            }
          })

          $('.sc-topbar__reply').on('click', () => {
            if ( steemComments.ISAUTHENTICATED){
              steemComments.addCommentTemplateAfter('.sc-section .sc-topbar__rule')
            } else {
              $('.sc-comments').prepend(steemComments.notificationTemplate('Please sign in to comment.'))
            }
            $('.sc-vote').remove()
          })

          $('.sc-section').on('click', '.sc-item__reply', (e) => {

            $('.sc-notification').remove()
            if ( steemComments.ISAUTHENTICATED){
              steemComments.addCommentTemplateAfter(e.currentTarget)
            } else {
              $(e.currentTarget).closest('.sc-item__right').append(steemComments.notificationTemplate('Please sign in to comment.'))
            }
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
            let parentElement = $(e.currentTarget).closest('.sc-item') || $('.sc-comments')

            let topLevel = $(e.currentTarget).parent().parent().hasClass('sc-section') ? true : false
            let message = $('.sc-comment__message').val()
            let parentPermlink = topLevel ? steemComments.PERMLINK : parentElement.data('permlink')
            let parentAuthor = topLevel ? steemComments.AUTHOR : parentElement.data('author')
            let title = topLevel ? '@'+parentAuthor : parentElement.data('title')
            let parentDepth = parentElement.data('post-depth')
            steemComments.sendComment(parentElement, parentAuthor,parentPermlink, message, title, parentDepth)
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
            <span class="sc-profile sc-profile--${steemComments.ISAUTHENTICATED}">
              <h3 class="sc-profile__name">${username}</h3>
              <img class="sc-profile__image" src="${profileImage}">
            </span>
            <a href="${authUrl}"" class="sc-login sc-login--${steemComments.ISAUTHENTICATED}">Sign In</a>
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
            let newComment = $(steemComments.singleCommentTemplate(response.res, parentDepth))
            let inputArea = $('.sc-comment__container')
            inputArea.fadeOut(400, (e) => {
              inputArea.remove()
            })

            $(parentElement).append(newComment)

            let offset = newComment.offset().top
            parent.postMessage({
              message: 'new-comment',
              inputAreaHeight: 100,
              offset: offset,
              depth: parentDepth || 0
            }, '*')

          }
        }
      })
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
            depth: result.content[post].depth,
            root_comment: result.content[post].root_comment,
            parent_permlink: result.content[post].parent_permlink,
            created: result.content[post].created,
            votes: result.content[post].net_votes,
            voters: result.content[post].active_votes.map(vote => vote.voter),
            value: Math.round( parseFloat(result.content[post].pending_payout_value.substring(0,5)) * 100) / 100
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

            let template = steemComments.createCommentTemplate(result,post, voted)
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
    createCommentTemplate: (result, post, voted) => {
          var permlink = post.parent_permlink
          var converter = new showdown.Converter();
          var html = converter.makeHtml(post.body);;

          try {
            var metadata = JSON.parse(result.accounts[post.author].json_metadata).profile
          }
          catch (err){
            var metadata = {profile_image: '/img/default-user.jpg'}
          }

          var voteMessage = (post.votes > 1 || post.votes == 0 )? 'votes' : 'vote'
          var voteValue = (post.value > 0) ? '</span> <span class="sc-item__divider">|</span> <span class="sc-item__votecount">$' + post.value  + '</span><span class="sc-item__votecount">': ''
          var reputation = `<span class="sc-item__reputation">[${steem.formatter.reputation(steemComments.USERACCOUNTS[post.author].reputation)}]</span>`
          var template = `
          <div data-post-id="${post.id}"
          data-permlink="${post.permlink}"
          data-author="${post.author}"
          data-title="${post.title}"
          data-post-depth="${post.depth}"
          data-bio="${metadata.about}"

          class="sc-item sc-cf sc-item__level-${post.depth} ${post.permlink}">
          <div class="sc-item__left">
          <img class="sc-item__image ${ steemComments.OPTIONS.profile ? 'sc-item__image--profile-enabled' : '' }" data-username="${post.author}" src="${metadata.profile_image}" height="50px" width="50px">
          </div>
          <div class="sc-item__right">
          <h4 class="sc-item__username">
          <a class="sc-item__author-link" href="https://steemit.com/@${post.author}" target="_blank">@${post.author}</a>

          ${steemComments.OPTIONS.reputation ? reputation : ''}

          <span class="sc-item__middot"> &middot; </span> <span class="sc-item__datetime"> ${ moment(post.created).fromNow() } </span>
          </h4>
          <p class="sc-item__content">${ html }</p>
          <div class="sc-item__meta">
          <span class="sc-item__upvote sc-item__upvote--voted-${voted}">
          <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          viewBox="0 0 50 50" width="18px" height="18px">
          <circle fill="transparent" stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st0" cx="25" cy="25" r="23"/>
          <line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st1" x1="13.6" y1="30.6" x2="26" y2="18.2"/>
          <line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st2" x1="36.4" y1="30.6" x2="24" y2="18.2"/>
          </svg>
          </span>
          <span class="sc-item__divider">|</span>
          <span class="sc-item__votecount">${post.votes} ${voteMessage} ${ steemComments.OPTIONS.values ? voteValue : ''}</span>
          <span class="sc-item__divider">|</span>
          <span class="sc-item__reply">Reply</span>
          </div>
          </div>
          </div>`
          return template;
        },
      singleCommentTemplate: (data, parentDepth) => {
        let post = {
          id : data.result.id,
          permlink : data.result.operations[0][1].permlink,
          author : data.result.operations[0][1].author,
          title : data.result.operations[0][1].title,
          body : data.result.operations[0][1].body,
          depth: parentDepth + 1
        }
        let metadata = {
          profile_image: $('.sc-section').data('profileimage')
        }
        var template = `
        <div data-post-id="${post.id}"
        data-permlink="${post.permlink}"
        data-author="${post.author}"
        data-title="${post.title}"
        data-post-depth="${post.depth}"

        class="sc-item sc-cf sc-item__level-${post.depth} ${post.permlink}">
        <div class="sc-item__left">
        <img class="sc-item__image" src="${metadata.profile_image}" height="50px" width="50px">
        </div>
        <div class="sc-item__right">
        <h4 class="sc-item__username">
        <a class="sc-item__author-link" href="https://steemit.com/@${post.author}" target="_blank">@${post.author}</a>
        <span class="sc-item__middot"> &middot; </span> <span class="sc-item__datetime"> ${ moment(post.created).fromNow() } </span>
        </h4>
        <p class="sc-item__content">${ post.body }</p>
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
        <span class="sc-item__votecount">0 votes</span>
        <span class="sc-item__divider">|</span>
        <span class="sc-item__reply">Reply</span>
        </div>
        </div>
        </div>`
        return template;
      },
      notificationTemplate: (message) => {
        $('.sc-notification').remove()
        let template = `
        <div class="sc-notification">${message}</>
        `
        return template;
      },
      timeoutNotifications: () => {
        setTimeout(() => {
          let n = $('.sc-notification')
            n.fadeOut(400, (e)=> {
              n.remove()
            })
        }, 3000)
      }
  }
  steemComments.init()
