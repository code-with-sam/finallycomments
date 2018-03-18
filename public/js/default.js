let app = {
  init: () => {
    let dashboard = $('main').hasClass('dashboard')
    if(dashboard) app.dashboardInit()
  },
  dashboardInit: () => {
    app.dashboardLoadPosts()
    app.dashboardUiActions()

    // setTimeout(()=>{
    //   // test
    //   $.post({
    //     url: `/new-thread`
    //   }, (response) => {
    //     console.log(response)
    //   })
    //
    // }, 3000)

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
        $('.dashboard__table--steem tbody').append(template)
      }
    }
    if(loadMore) {
      query = { tag: username, limit: 10, start_author: username,
        start_permlink: $('tr').last().data('permlink') }
    }
    steem.api.getDiscussionsByBlog(query, (err, result) => {
      if (err === null) listPosts(result)
    })
  },
  dashboardUiActions: () => {
    $('.load-more-posts').on('click', (e) => {
      app.dashboardLoadPosts(true)
    })
    $('.dashboard').on('click', '.load-embed', (e) => {
      let permlink = $(e.currentTarget).data('permlink')
      let controls = {
         values: true, rep: true, profile: true,
         generated: $(e.currentTarget).data('generated') ? true : false }
      console.log(controls)
      app.dashboadLoadEmbed(permlink, controls)
      $('.overlay').data('permlink', permlink)
      $('.overlay').addClass('--is-active')
    })
    $('.dashboard').on('change', '.embed-control', (e) => {
      let permlink = $('.overlay').data('permlink')
      let controls = {
        values: $('*[data-value="votes"]').is(':checked'),
        rep: $('*[data-value="reputation"]').is(':checked'),
        profile: $('*[data-value="profile"]').is(':checked')
      }
      app.dashboadLoadEmbed(permlink, controls)
    })
    $('.overlay__bg').on('click', (e) => {
      $('.overlay').removeClass('--is-active')
    })
  },
  dashboadLoadEmbed: (permlink, controls) => {
    let id = `    data-id="https://steemit.com${permlink}"\n`
    let rep = controls.rep ? '    data-reputation="true"\n' :''
    let values = controls.values ? '    data-values="true"\n' :''
    let profile = controls.profile ? '    data-profile="true"\n' :''
    let generated = controls.generated ? '    data-generated="true"\n' : '    data-generated="false"\n'
    let embedTemplate = `
<section class="finally-comments"
${id}${rep}${values}${profile}${generated}</section>
<script src="https://finallycomments.com/js/finally.min.js"></script>
    `
    $('.embed-code').empty()
    $('.embed-code').text(embedTemplate)
  }

}
app.init()
