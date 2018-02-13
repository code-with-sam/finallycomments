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
  <section class="finally-comments" data-id="${url}" data-reputation="true" data-values="true" data-profile="true"></section>
  <script src="https://finallycomments.com/js/finally.min.js"></script>
  `
  $('.embed-code').empty()
  if (url) {
    $('.embed-container').append(embedContainer)
    $('.embed-container .embed-code').text(embedTemplate)
  }

})
