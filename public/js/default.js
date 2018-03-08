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
    $('.embed-container').empty()
    $('.embed-container').append(embedContainer)
    $('.embed-container .embed-code').text(embedTemplate)
  }

})

let app = {
  init: () => {
    let dashboard = $('main').hasClass('dashboard')
    if(dashboard) app.dashboardInit()
  },
  dashboardInit: () => {
    let listPosts = (posts) => {
      for (var i = 0; i < posts.length; i++) {
          let template = `
          <tr><td>${posts[i].children}</td><td>${posts[i].url}</td><td><button class="button is-dark">Embed</button></td></tr>
          `
          $('.table tbody').append(template)
      }
    }
    let query = { tag: $('main').data('username'), limit: 10 }
    steem.api.getDiscussionsByBlog(query, (err, result) => {
      if (err === null) listPosts(result)
    })

  }
}
app.init()
