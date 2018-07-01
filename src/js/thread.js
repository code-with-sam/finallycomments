import "../scss/style.scss"

const frame = require('iframe-resizer')

import $ from 'jquery'
import steem from 'steem'
import showdown from 'showdown'
import moment from 'moment'
import purify from 'dompurify'

const f = {
    CATEGORY: '',
    AUTHOR: '',
    PERMLINK: '',
    PROFILEIMAGE: '',
    ISAUTHENTICATED: $('.sc-section').data('auth'),
    rootAuthor: '',
    USERACCOUNTS: [],
    OPTIONS: {},
    upvoteIcon: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 50" width="18px" height="18px"><circle fill="transparent" stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st0" cx="25" cy="25" r="23"/><line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st1" x1="13.6" y1="30.6" x2="26" y2="18.2"/><line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st2" x1="36.4" y1="30.6" x2="24" y2="18.2"/></svg>',
    authenticatedUser: () => {
      if (f.ISAUTHENTICATED) return $('.sc-section').data('username')
      return false
    },
    isThreadOwner: (post) => {
      if (f.authenticatedUser() === f.AUTHOR) return true
      return false
    },
    init: () => {
      f.getPartsFromLink()
      f.addTopBar()
      f.getComments()
      f.uiActions()
      window.addEventListener('message', f.frameLoad, false);
    },
    setOptions: (data) => {
      f.OPTIONS.reputation = data.reputation === 'false' ? false : true
      f.OPTIONS.values = data.values === 'false' ? false : true
      f.OPTIONS.profile = data.profile === 'false' ? false : true
      f.OPTIONS.generated = data.generated === 'false' ? false : true
      f.OPTIONS.beneficiary = data.beneficiary || false
      f.OPTIONS.beneficiaryWeight = parseInt(data.beneficiaryWeight) || 0
      f.OPTIONS.guestComments = true
    },
    frameLoad: (event) => {
      if (event.data.message == 'finally-frame-load'){
        f.setOptions(event.data)
        f.initAfterOptionsSetActions()
      }
    },
    initAfterOptionsSetActions: () => {
      if (f.OPTIONS.guestComments) {
        f.getGuestComments(f.PERMLINK)
          .then(() => f.getGuestReplyComments(f.PERMLINK))
          .then(() => f.applyCommentModeration(f.PERMLINK))
      }
    },
    uiActions: () => {
          $('.sc-section').on('click', '.sc-login', (e) => {
            let authUrl = $(e.currentTarget).attr('href')
            let authWindow = window.open(authUrl,'Steemconnect Auth','height=700,width=600');
            if (window.focus) authWindow.focus();
            return false;
          })
          $('.sc-topbar').on('click', '.sc-profile__image', () => {
            let template = `
            <div class="sc-settings sc-settings--active">
              <a class="sc-settings__logout" href="/auth/logout/${f.CATEGORY}/@${f.AUTHOR}/${f.PERMLINK}">Logout</a>
            </div>
            `
            if( $('.sc-settings').hasClass('sc-settings--active') ){
              $('.sc-settings').remove()
            } else {
              $('.sc-profile').append(template);
            }
          })

          $('.sc-topbar__upvote').on('click', () => {
            if ( f.ISAUTHENTICATED && $('.sc-topbar__upvote').hasClass('sc-topbar__upvote--voted-true')){
              $('.sc-comments').prepend(f.notificationTemplate('You have already voted.'))
            } else if ( f.ISAUTHENTICATED ){
              f.addVoteTemplateAfter('.sc-topbar__upvote')
            } else {
              $('.sc-comments').prepend(f.notificationTemplate('Please sign in to vote.'))
            }
          })

          $('.sc-topbar__reply').on('click', () => {
            f.addCommentTemplateAfter('.sc-section .sc-topbar__rule')
            $('.sc-vote').remove()
            $('.sc-notification').remove()
          })

          $('.sc-section').on('click', '.moderation-temp-show', (e) => {
             let commentData = $(e.currentTarget).closest('.sc-item').data()
             $(e.currentTarget).addClass('moderation-temp-hide').removeClass('moderation-temp-show').text('Hide Comment')
            $(`.${commentData.permlink}`).children('.sc-item__left, .sc-item__right').show()
          })
          $('.sc-section').on('click', '.moderation-temp-hide', (e) => {
             let commentData = $(e.currentTarget).closest('.sc-item').data()
             $(e.currentTarget).removeClass('moderation-temp-hide').addClass('moderation-temp-show').text('Show Comment')
            $(`.${commentData.permlink}`).children('.sc-item__left, .sc-item__right').hide()
          })

          $('.sc-section').on('click', '.sc-item__reply', (e) => {
              f.addCommentTemplateAfter(e.currentTarget)
              $('.sc-vote').remove()
              $('.sc-notification').remove()
          })

          $('.sc-section').on('click', '.sc-item__hide', (e) => {
              let commentData = $(e.currentTarget).closest('.sc-item').data()
              console.log(commentData)
              f.sendCommentModeration('hide', commentData)
                .then(response => {
                  if (response.error) $(e.currentTarget).closest('.sc-item__right').append(f.notificationTemplate(response.error))
                  else f.renderModerationMessage(commentData.permlink, '- [Hidden By Moderation]')
                })
          })

          $('.sc-section').on('click', '.sc-item__delete', (e) => {
              let commentData = $(e.currentTarget).closest('.sc-item').data()
              console.log(commentData)
              f.sendCommentModeration('delete', commentData)
                .then(response => {
                  if (response.error) $(e.currentTarget).closest('.sc-item__right').append(f.notificationTemplate(response.error))
                  else f.renderModerationMessage(commentData.permlink, '- [Deleted]')
                })
          })

          $('.sc-section').on('click', '.sc-item__upvote', (e) => {
            if ( $(e.currentTarget).hasClass('sc-item__upvote--voted-true') ){
              $(e.currentTarget).closest('.sc-item__right').append(f.notificationTemplate('You have already voted.'))
              f.timeoutNotifications()
              return false
            }
            $('.sc-notification').remove()
            if ( f.ISAUTHENTICATED){
              f.addVoteTemplateAfter(e.currentTarget)
            } else {
              $(e.currentTarget).closest('.sc-item__right').append(f.notificationTemplate('Please sign in to vote.'))
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
            let permlink = topLevel ? f.PERMLINK : parentElement.data('permlink')
            let author = topLevel ? f.AUTHOR : parentElement.data('author')
            $('.sc-vote__value').text(weight + '%')
            f.sendVote(parentElement, author, permlink, weight)
          })

          $('.sc-section').on('click', '.sc-comment__btn' , (e) => {
            e.preventDefault()
            let $parentElement = $(e.currentTarget).closest('.sc-item') ||  $('.sc-comments')
            let topLevel = $(e.currentTarget).parent().parent().hasClass('sc-section') ? true : false
            let message = $('.sc-comment__message').val()
            let parentPermlink = topLevel ? f.PERMLINK : $parentElement.data('permlink')
            let parentAuthor = topLevel ? f.AUTHOR : $parentElement.data('author')
            let title = topLevel ? '@'+parentAuthor : $parentElement.data('title')
            let parentDepth = $parentElement.data('post-depth')

            if ( $parentElement.data('guest') ) {
              f.sendGuestReplyComment($parentElement, parentAuthor,parentPermlink, message, title, parentDepth)
            } else {
              f.sendComment($parentElement, parentAuthor,parentPermlink, message, title, parentDepth)
            }
          })

          $('.sc-section').on('click', '.sc-guest-comment__btn' , (e) => {
            e.preventDefault()
              let parentElement = $(e.currentTarget).closest('.sc-item') || $('.sc-comments')
              let topLevel = $(e.currentTarget).parent().parent().hasClass('sc-section') ? true : false
              let message = $('.sc-comment__message').val()
              let parentPermlink = topLevel ? f.PERMLINK : parentElement.data('permlink')
              let parentAuthor = topLevel ? f.AUTHOR : parentElement.data('author')
              let title = topLevel ? '@'+parentAuthor : parentElement.data('title')
              let parentDepth = parentElement.data('post-depth') || 0
              let author = $('.sc-input--guestname').val()

              if (author === '') {
                 $(parentElement).children('.sc-item__right').append(f.notificationTemplate('Name can not be empty'))
              } else {
                console.log(parentElement, parentAuthor,parentPermlink, message, title, parentDepth, author)
                f.sendGuestComment(parentElement, parentAuthor,parentPermlink, message, title, parentDepth, author)
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
            steem.formatter.estimateAccountValue(f.USERACCOUNTS[username])
            .then( data => {
              accountValue = data
              steem.api.getFollowCountAsync(username)
              .then( data => {
                socialStats = data

                item.parent().append(`
                  <div class="sc-item__overlay sc-item__overlay--open">
                  <img width="100" height="100" src="${profileImage}">
                  <h3>@${username} [${steem.formatter.reputation(f.USERACCOUNTS[username].reputation)}]</h3>

                  <h4>Posts: ${f.USERACCOUNTS[username].post_count} | Followers: ${socialStats.follower_count} | Following ${socialStats.following_count} </h4>
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
                f.sortComments(order);
          })

    },
    getPartsFromLink: () => {
      let url = $('.sc-section').data('steemlink')
      let lastChar = url.substr(url.length -1);
      if (lastChar === '/')
      url = url.slice(0, -1);

      let parts = url.split('/')

      f.PERMLINK = parts.pop();
      f.AUTHOR = parts.pop().substr(1);
      f.CATEGORY = parts.pop();
    },
    addTopBar: () => {
      let username = $('.sc-section').data('username')
      let profileImage = $('.sc-section').data('profileimage')
      let authUrl = $('.sc-section').data('auth-url')
      let template = `
          <div class="sc-topbar sc-cf">
            <span class="sc-topbar__upvote">${f.upvoteIcon}</span>
            <span class="sc-topbar__reply">Reply</span>

            <span class="sc-topbar__count">00 Comments</span>
            <span class="sc-profile sc-profile--${f.ISAUTHENTICATED}">
              <h3 class="sc-profile__name">${username}</h3>
              <img class="sc-profile__image" src="${profileImage}">
            </span>
            <a href="${authUrl}"" class="sc-login sc-login--topbar sc-login--${f.ISAUTHENTICATED}">Sign In</a>
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
      let postButton =  f.ISAUTHENTICATED ? '<a href="#" target="_blank" class="sc-comment__btn">Post</a>' : guestPostUI
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
      <span class="sc-vote__btn">
        <span class="sc-topbar__upvote">${f.upvoteIcon}</span>
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
              $(parentElement).children('.sc-item__right').append(f.notificationTemplate(response.error))
            } else {
              if (response.status == 'fail'){
                $(parentElement).find('.sc-vote').remove()
                let msg = 'You have already voted in a similar way'
                if (response.status.includes(msg)){
                  $(parentElement).children('.sc-item__right').append(f.notificationTemplate(msg))

                } else {
                  $(parentElement).children('.sc-item__right').append(f.notificationTemplate('Unknown error, please try again.'))
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
          parentTitle: parentTitle,
          beneficiary: f.OPTIONS.beneficiary,
          beneficiaryWeight: parseInt(f.OPTIONS.beneficiaryWeight)
        }
      }, (response) => {
        if (response.error) {
          $(parentElement).append(f.notificationTemplate('Error posting comment please try again after 20 seconds'))
        } else {
          if (response.status == 'fail'){
            $(parentElement).append(f.notificationTemplate(response.message))
          } else {
            f.appendSuccessfulComment(response, parentDepth, parentElement, true)
          }
        }
      })
    },
    appendSuccessfulComment: async (response, parentDepth, parentElement, fromSteem) => {
      let newComment, guestReply = false, guest = false;
      let commentdata = f.processAjaxCommentData(response.data, fromSteem, parentDepth)
      if (!fromSteem && !f.ISAUTHENTICATED) guest = true
      if (!fromSteem && f.ISAUTHENTICATED) guestReply = true
      if(f.ISAUTHENTICATED){
        let accountData = await steem.api.getAccountsAsync([f.authenticatedUser()])
        f.USERACCOUNTS[accountData[0].name] = accountData[0]
      }
      newComment = $(f.createCommentTemplate(f.USERACCOUNTS, commentdata, false, false, guest, guestReply))
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
        rootComment: f.PERMLINK,
        rootCategory: f.CATEGORY,
        rootAuthor: f.AUTHOR,
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
          $(parentElement).append(f.notificationTemplate(response.message))
        } else {
          f.appendSuccessfulComment(response, parentDepth, parentElement, false)
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
        rootComment: f.PERMLINK,
        rootCategory: f.CATEGORY,
        rootAuthor: f.AUTHOR
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
          $(parentElement).append(f.notificationTemplate(response.message))
        } else {
          f.appendSuccessfulComment(response, parentDepth, parentElement, false )
        }
      })
    },
    getGuestComments: async (rootPermlink) => {
      const response = await $.post({
        url: '/guest-comments',
        dataType: 'json',
        data: { permlink: rootPermlink}
      })
      await f.displayGuestComments(response.guestComments)
      return
    },
    getGuestReplyComments: async (rootPermlink) => {
      const response = await $.post({
        url: '/guest-reply-comments',
        dataType: 'json',
        data: { permlink: rootPermlink }
      })
      await f.displayGuestReplyComments(response.guestReplyComments)
      return
    },
    // Guest comments are not connected to the STEEM blockchain
    // Can not be voted
    // no need to search for accounts (user nickname provided by user)
    displayGuestComments: async (comments) => {
      f.displayCommentCount(comments.length)
      comments.forEach( (post, i, arr) => {
        let order = post.depth === 1 ? i : false
        let accounts = undefined // no account arry to loop over for guests
        let voted = false
        let template = f.createCommentTemplate(accounts, post, voted, order, true)
        console.log( post.depth)
        if ( parseInt(post.depth) === 1 ) {
          $('.sc-comments').prepend( template)
        } else if ( parseInt(post.depth)  > 1) {
          $('.' + post.parent_permlink ).append( template)
        }
      })
      return
    },
    // Async so that we can request any new account data for the authorised user
    displayGuestReplyComments: async (comments) => {
      f.displayCommentCount(comments.length)
      let authors = comments.map(comment => comment.author)
      let newAccounts = await steem.api.getAccountsAsync(authors)
      newAccounts.forEach(user => f.USERACCOUNTS[user.name] = user )
      comments.forEach( (post, i, arr) => {
        let order = parseInt(post.depth) === 1 ? i : false
        let voted = false
        let template = f.createCommentTemplate(f.USERACCOUNTS, post, voted, order, false, true)
        if ( parseInt(post.depth) === 1 ) {
          $('.sc-comments').prepend( template)
        } else if ( post.depth  > 1) {
          $('.' + post.parent_permlink ).append( template)
        }
      })
      return
    },
    sendCommentModeration: async (moderationType, commentData) => {
      return await $.post({
        url: '/moderation',
        dataType: 'json',
        data: { moderationType,
          commentAuthor: commentData.author,
          commentCategory: commentData.category,
          commentPermlink: commentData.permlink,
          rootPostPath: `/${f.CATEGORY}/@${f.AUTHOR}/${f.PERMLINK}`,
          isGuestComment: commentData.guest,
          isGuestReplyComment: commentData.guestReply }
      })
    },
    applyCommentModeration: async (rootPermlink) => {
      const response = await $.get({url: `/moderation/${rootPermlink}`})
      console.log(response)
      const deleted = response.moderation.filter(comment => comment.status === 'delete')
      const hidden = response.moderation.filter(comment => comment.status === 'hide')
      deleted.forEach(comment => f.renderModerationMessage(comment.permlink, '- [Deleted By Moderation]'))
      hidden.forEach(comment => f.renderModerationMessage(comment.permlink, '- [Hidden By Moderation] -- <span class="moderation-temp-show">Show Comment</a>'))
    },
    renderModerationMessage: (permlink, message) => {
      $(`.${permlink}`).prepend(`<p class="moderation--message">${message}</p>`)
      $(`.${permlink}`).children('.sc-item__left, .sc-item__right').hide()
    },
    getComments: () => {
      return new Promise((resolve, reject) => {
        $('.sc-section').append('<div class="sc-comments"></div>')

        steem.api.getState(`/${f.CATEGORY}/@${f.AUTHOR}/${f.PERMLINK}`, function(err, result) {
          f.USERACCOUNTS = result.accounts
          let resultsArray = [];

          for (let post in result.content ){

            var html = result.content[post].body
            resultsArray.push({
              id: result.content[post].id,
              title: result.content[post].root_title,
              author: result.content[post].author,
              category: result.content[post].category,
              body: html,
              permlink: result.content[post].permlink,
              depth: f.OPTIONS.generated ? result.content[post].depth - 1 : result.content[post].depth ,
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
              if( f.ISAUTHENTICATED ){
                voted = post.voters.indexOf(f.authenticatedUser()) > -1 ? true : false
              }
              let order = post.depth === 1 ? i : false
              let template = f.createCommentTemplate(result.accounts,post, voted, order)
              if ( parseInt(post.depth) === 1 ) {

                $('.sc-comments').prepend( template)
              } else if ( parseInt(post.depth) > 1) {
                var permlink = post.parent_permlink
                $('.' + permlink ).append( template)
              }
            })
          })

          f.displayCommentCount(resultsArray.length - 1)

          if( f.ISAUTHENTICATED ){
            let topLevelPost = resultsArray[resultsArray.length -1]
            let voted = topLevelPost.voters.indexOf(f.authenticatedUser()) > -1 ? true : false
            $('.sc-topbar__upvote').addClass(`sc-topbar__upvote--voted-${voted}`)
          }
          resolve()
        });
      });
    },
    // Returns HTML for an individual comment
    // @param accounts - Object - User accounts in STEEM API format
    // @param post - Object - Data for a specific comment
    // @param voted - Boolean - If the comment being generated has been voted by the currently authenticated User
    // @param guest - Boolean - IF the comment being generated is a guest comment
    // @parem guestReply - Boolean - if the comment being generated is by an authenticated user but in reply to a guest
    createCommentTemplate: (accounts, post, voted, order, guest, guestReply) => {
          Object.keys(post).forEach(key => post[key] = purify.sanitize(post[key]))
          var permlink = post.parent_permlink
          var converter = new showdown.Converter();
          var html = converter.makeHtml(post.body);;
          var metadata;
          try {
            metadata = JSON.parse(accounts[post.author].json_metadata).profile
          } catch (err){
            metadata = {about: '', profile_image: '/img/default-user.jpg'}
          }

          if (!guest && accounts[post.author].json_metadata === '{}') {
            metadata = {about: '', profile_image: '/img/default-user.jpg'}
          }

          var voteMessage = (post.votes > 1 || post.votes == 0 )? 'votes' : 'vote'
          var voteValue = (post.value > 0) ? '</span> <span class="sc-item__divider">|</span> <span class="sc-item__votecount">$' + post.value  + '</span><span class="sc-item__votecount">': ''
          var reputation = guest ? '' :`<span class="sc-item__reputation">[${steem.formatter.reputation(f.USERACCOUNTS[post.author].reputation)}]</span>`
          let authorLink = guest ? `<span class="sc-item__author-link">${post.author} (Guest)</span>` : `<a class="sc-item__author-link" href="https://steemit.com/@${post.author}" target="_blank">@${post.author}</a>`
          let upvote = `<span class="sc-item__upvote sc-item__upvote--voted-${voted}">${f.upvoteIcon}</span>
                    <span class="sc-item__divider">|</span>
                    <span class="sc-item__votecount">${post.votes} ${voteMessage} ${ f.OPTIONS.values ? voteValue : ''}</span>
                    <span class="sc-item__divider">|</span>
                    `
          if (guest || guestReply) upvote = ''

          let moderate =  f.isThreadOwner(post) ? `
          <span class="sc-item__divider">|</span>
          <button class="sc-item__hide">Hide</button>
          ` : ''
          let moderateGuest = f.isThreadOwner(post) && guest || f.isThreadOwner(post) && guestReply ? '<button class="sc-item__delete">Delete</button>': ''

          var template = `
          <div data-post-id="${post.id}"
          data-permlink="${post.permlink}"
          data-category="${post.category}"
          data-author="${post.author}"
          data-title="${post.title}"
          data-post-depth="${post.depth}"
          data-bio="${metadata.about}"
          data-order="${order}"
          data-value="${post.value}"
          data-guest="${guest ? true : false }"
          data-guest-reply="${guestReply ? true : false }"

          class="sc-item sc-cf sc-item__level-${post.depth} ${post.permlink}">

          <div class="sc-item__left">
          <img class="sc-item__image ${ f.OPTIONS.profile ? 'sc-item__image--profile-enabled' : '' }" data-username="${post.author}" src="${metadata.profile_image}" height="50px" width="50px" onerror="this.src='/img/default-user.jpg'">
          </div>
          <div class="sc-item__right">
          <h4 class="sc-item__username">
          ${authorLink}
          ${f.OPTIONS.reputation ? reputation : ''}

          <span class="sc-item__middot"> &middot; </span> <span class="sc-item__datetime"> ${ moment(post.created).fromNow() } </span>
          </h4>
          <p class="sc-item__content">${ html }</p>
          <div class="sc-item__meta">
          ${upvote}
          <span class="sc-item__reply">Reply</span>
          ${moderate}
          ${moderateGuest}
          </div>
          </div>
          </div>`
          return template;
        },
      // prepare RAW data from STEEM API and Finally Database into a recongnised format
      // @param data - Object - from Finally database or STEEM API
      // @param fromSteem - Boolean - specificy if data is from STEEM API or not
      // @param parentDepth - Int - The depth(indentation) of the parent comment this is inresponse to
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
      },
      displayCommentCount: (num) => {
        let count = parseInt($('.sc-topbar__count').text().split(' ')[0])
        $('.sc-topbar__count').text(`${count + num} Comments`)
      }
  }
  f.init()
