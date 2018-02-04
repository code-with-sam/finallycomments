$('.generate-embded').on('click', () => {
  console.log('generate')
  let url = $('.generate-url').val().trim()

  let embedContainer = `
  <h3 class="title is-4">Embed Code</h3>
  <pre>
    <code class="embed-code language-html">
    </code>
  </pre>
  `

  let embedTemplate = `
  <section class="finally-comments" data-id="${url}"></section>
  <script src="http://finallycomments.net/js/finally.min.js"></script>
  `
  $('.embed-code').empty()
  if (url) {
    $('.embed-container').append(embedContainer)
    $('.embed-container .embed-code').text(embedTemplate)
  }

})
