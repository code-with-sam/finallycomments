const frame = require('iframe-resizer')

let finallyCommentsSystem = {
  init: () => {
      finallyCommentsSystem.setupIframe();
      console.log(frame)
      frame.iframeResizer( {}, '.finally-comments iframe' );

  },
  getPartsFromLink: (url) => {
    let lastChar = url.substr(url.length -1);
    if (lastChar === '/')
    url = url.slice(0, -1);

    let parts = url.split('/')

    return {
      permlink: parts.pop(),
      author: parts.pop(),
      category: parts.pop()
    }
  },
  setupIframe: () => {
    let container = document.querySelector('.finally-comments')
    let url = container.dataset.id
    let finallyUrl;
    if (container.dataset.api){
      finallyUrl = url
    } else {
      let urlParts = finallyCommentsSystem.getPartsFromLink(url)
      finallyUrl = `https://localhost:3000/thread/${urlParts.category}/${urlParts.author}/${urlParts.permlink}`
    }
    console.log('URL: ', finallyUrl)
    let iframe = document.createElement('iframe', { scrolling: 'no' });
    iframe.src = finallyUrl;
    iframe.width = '100%';
    iframe.style = 'border: none;'
    container.appendChild(iframe)
    iframe.classList.add('finally-frame');
    let finallySettings = {
      message: 'finally-frame-load',
      reputation: container.dataset.reputation,
      profile: container.dataset.profile,
      values: container.dataset.values,
      generated: container.dataset.generated
    }
    iframe.onload = () => {
      document.querySelector('.finally-frame').contentWindow.postMessage(finallySettings,'*')
    }
  }
}

finallyCommentsSystem.init();






window.addEventListener('message', receiveMessage, false);

function receiveMessage(event)
{
  if (event.data.message == 'new-comment'){
    if (event.origin !== 'https://finallycomments.com' )
      return;

    let frameOffset = getDistanceFromTop(document.querySelector('.finally-comments'))
    let frameHeight = document.querySelector('.finally-comments').getBoundingClientRect().height;

    if ( event.data.depth === undefined || event.data.depth === 0 ){
      document.documentElement.scrollTop = ( frameOffset +  frameHeight )
    } else {
      document.documentElement.scrollTop = ( event.data.offset +  frameOffset - 300)
    }

  }
}

function getDistanceFromTop(element) {
    var yPos = 0;

    while(element) {
        yPos += (element.offsetTop);
        element = element.offsetParent;
    }

    return yPos;
}
