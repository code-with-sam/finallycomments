import "../scss/style.scss"

import $ from 'jquery'
import steem from 'steem'

const finallyButton = {
  CATEGORY: '',
  AUTHOR: '',
  PERMLINK: '',
  ISAUTHENTICATED: $('.finallybutton').data('auth'),
  AUTHENTICATEDUSER: $('.finallybutton').data('username'),
  upvoteIcon: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 50" width="18px" height="18px"><circle fill="transparent" stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st0" cx="25" cy="25" r="23"/><line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st1" x1="13.6" y1="30.6" x2="26" y2="18.2"/><line stroke="#000000" stroke-width="3" strokemiterlimit="10" class="st2" x1="36.4" y1="30.6" x2="24" y2="18.2"/></svg>',
  init: async () => {
    finallyButton.getPartsFromLink()
    finallyButton.uiActions()
    finallyButton.checkVoteStatus()
      .then(status => finallyButton.highlightVoteStatus(status))
  },
  getPartsFromLink: () => {
    let url = $('.finallybutton').data('steemlink')
    let lastChar = url.substr(url.length -1);
    if (lastChar === '/') url = url.slice(0, -1);
    let parts = url.split('/')
    finallyButton.PERMLINK = parts.pop();
    finallyButton.AUTHOR = parts.pop().substr(1);
    finallyButton.CATEGORY = parts.pop();
  },
  uiActions: () => {
    $('.finallybutton').on('click', (e) => finallyButton.activateButton(e))
    $('body').on('input', '.finallyvote__slider', (e) => finallyButton.showVoteSliderValue() )
    $('body').on('click', '.finallyvote__btn', (e) => finallyButton.calcVote() )
    $('body').on('click', '.finallyvote__close', (e) => $(e.currentTarget).parent().remove() )
  },
  activateButton: (e) => {
    if(finallyButton.ISAUTHENTICATED){
      finallyButton.loadVoteSlider()
      // finallyButton.sendVote(finallyButton.AUTHOR,finallyButton.PERMLINK, 100)
    } else {
      finallyButton.authenticatedUser(e)
    }
  },
  loadVoteSlider: () => {
    let template = `<div class="finallyvote">
    <span class="finallyvote__btn">${finallyButton.upvoteIcon}</span>
    <span class="finallyvote__value">50%</span>
    <input type="range" min="1" max="100" value="50" class="finallyvote__slider" id="myRange">
    <span class="finallyvote__close" >&#43;</span>
    </div>`
    $(template).insertBefore('.finallybutton')
  },
  showVoteSliderValue: () => {
    let weight = $('.finallyvote__slider').val()
    $('.finallyvote__value').text(weight + '%')
  },
  checkVoteStatus: async () => {
    if(finallyButton.ISAUTHENTICATED){
      let content = await steem.api.getContentAsync(finallyButton.AUTHOR , finallyButton.PERMLINK)
      return content.active_votes.filter(v => v.voter === finallyButton.AUTHENTICATEDUSER).length === 1
    }
  },
  highlightVoteStatus(voted) {
    if(voted) {
      $('.finallybutton span').text('Voted')
      $('.finallybutton').addClass('finallybutton--voted')
    }
  },
  authenticatedUser: (e) => {
    let authUrl = $(e.currentTarget).data('auth-url')
    let authWindow = window.open(authUrl,'Steemconnect Auth','height=700,width=600');
    if (window.focus) authWindow.focus();
    return false;
  },
  calcVote: () => {
    let weight = parseInt($('.finallyvote__slider').val())
    finallyButton.sendVote(finallyButton.AUTHOR , finallyButton.PERMLINK, weight)
  },
  sendVote: (author, permlink, weight) => {
      $.post({ url: `/vote/${author}/${permlink}/${weight}`}, (response) => finallyButton.processVoteResponse(response) )
  },
  processVoteResponse: (response) => {
    if (response.error) return console.log(response.error)
    if (response.status == 'fail'){
      console.log('Unknown error, please try again.')
    } else {
      // vote sucess
    }
  }
}

finallyButton.init()
