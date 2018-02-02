// Finally Comments System
// <div class="finally-comments" data-id=""></>

let finallyCommentsSystem = {
  init: () => {
    let container = document.queryselector('.finally-comments')
    let url = container.dataset.id
    let iframe = document.createElement('iframe', {
      width : '100%',
      src: url,
      scrolling: 'no'
    });
    container.appendChild(iframe)
  }
}


finallyCommentsSystem();
