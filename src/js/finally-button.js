import "../scss/style.scss"

import $ from 'jquery'
import steem from 'steem'

const finallyButton = {
  CATEGORY: '',
  AUTHOR: '',
  PERMLINK: '',
  ISAUTHENTICATED: $('button').data('auth'),
  AUTHENTICATEDUSER: $('button').data('username'),
  upvoteIcon: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 50" width="18px" height="18px"><circle fill="transparent" stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st0" cx="25" cy="25" r="23"/><line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st1" x1="13.6" y1="30.6" x2="26" y2="18.2"/><line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st2" x1="36.4" y1="30.6" x2="24" y2="18.2"/></svg>',
  init: () => {
    finallyButton.getPartsFromLink()
    finallyButton.uiActions()
    if(finallyButton.ISAUTHENTICATED) finallyButton.checkVoteStatus()
  },
  getPartsFromLink: () => {
    let url = $('button').data('steemlink')
    let lastChar = url.substr(url.length -1);
    if (lastChar === '/')
      url = url.slice(0, -1);

    let parts = url.split('/')

    finallyButton.PERMLINK = parts.pop();
    finallyButton.AUTHOR = parts.pop().substr(1);
    finallyButton.CATEGORY = parts.pop();
  },
  uiActions: () => {
    $('body').on('click', '.finallybutton', (e) => {
      if(finallyButton.ISAUTHENTICATED){
        // vote
      } else {
        finallyButton.authenticatedUser(e)
      }
    })
  },
  checkVoteStatus: async () => {
    let content = await steem.api.getContentAsync(finallyButton.AUTHOR , finallyButton.PERMLINK)
    console.log(content)
    console.log(finallyButton.AUTHENTICATEDUSER)
    let voted = content.active_votes.filter(v => v.voter === finallyButton.AUTHENTICATEDUSER).length === 1
    console.log('voted: ', voted)
  },
  authenticatedUser: (e) => {
    let authUrl = $(e.currentTarget).data('auth-url')
    let authWindow = window.open(authUrl,'Steemconnect Auth','height=700,width=600');
    if (window.focus) authWindow.focus();
    return false;
  }
}

finallyButton.init()
