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
    app.dashboardLoadPosts()
    app.dashboardUiActions()
  },
  dashboardLoadPosts: (loadMore) => {
    let username = $('main').data('username')
    let query = { tag: username, limit: 10 }
    let listPosts = (posts) => {
      if (posts.length < 10) $('.load-more-posts').remove()
      for (var i = 0; i < posts.length; i++) {
        if(loadMore && i === 0) continue
        let template = `<tr data-permlink=${posts[i].permlink}>
          <td>${posts[i].children}</td>
          <td>${posts[i].title}</td>
          <td><button class="button is-dark load-embed" data-permlink="${posts[i].url}">Generate</button></td>
        </tr>`
        $('.table tbody').append(template)
      }
    }
    if(loadMore) {
      query = { tag: username, limit: 10, start_author: username,
        start_permlink: $('tr').last().data('permlink') }
    }
    steem.api.getDiscussionsByBlog(query, (err, result) => {
      console.log(err, result)
      if (err === null) listPosts(result)
    })
  },
  dashboardUiActions: () => {
    $('.load-more-posts').on('click', (e) => {
      console.log('load more')
      app.dashboardLoadPosts(true)
    })
    $('.dashboard').on('click', '.load-embed', (e) => {
      let permlink = $(e.currentTarget).data('permlink')
      app.dashboadLoadEmbed(permlink)
      $('.overlay').addClass('--is-active')
    })
    $('.overlay__bg').on('click', (e) => {
      $('.overlay').removeClass('--is-active')
    })
  },
  dashboadLoadEmbed: (permlink) => {
    console.log(permlink)
    let url = `https://steemit.com${permlink}`
    let embedTemplate = `
    <section class="finally-comments"
    data-id="${url}"
    data-reputation="true"
    data-values="true"
    data-profile="true"></section>
    <script src="https://finallycomments.com/js/finally.min.js"></script>
    `
    $('.embed-code').empty()
    $('.embed-code').text(embedTemplate)
  }

}
app.init()
