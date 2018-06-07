import '../../node_modules/bulma/bulma.sass'
import '../scss/landing.scss'

import $ from 'jquery'
import steem from 'steem'
import showdown from 'showdown'
import finallycomments from 'finallycomments'
import purify from 'dompurify'

let app = {
  init: () => {
    let dashboard = $('main').hasClass('dashboard')
    let index = $('main').hasClass('index')
    let single = $('main').hasClass('single-post')
    if(dashboard) app.dashboardInit()
    if(index) app.indexInit();
    if(single) app.initSinglePost();
  },
  dashboardInit: () => {
    app.dashboardLoadPosts()
    app.dashboardUiActions()
    app.dashboardLoadPane()
  },
  indexInit: () => {
    finallycomments.init()
    let options = {
      values: true,
      reputation: true,
      profile: false
    }
    finallycomments.appendTo('.finally__example', 'thread', 'finally-hellomars', 'sambillingham', options)
  },
  initSinglePost: async () => {
    let permlink = $('main').data('permlink')
    let postData = await steem.api.getContentAsync('sambillingham', permlink)
    app.appendSingePostContent(postData)
    finallycomments.init()
    finallycomments.loadEmbed('.single-post__finally-comments')
  },
  appendSingePostContent: (post) => {
    var converter = new showdown.Converter();
    var html = purify.sanitize(converter.makeHtml(post.body))
    let template = `<h2>${post.title}</h2>${html}`
    $('.single-post__content').append(template)
  },
  dashboardLoadPane: () => {
    if(window.location.hash) {
      console.log(window.location.hash)
      $('.pane').hide()
      $(`.pane__${window.location.hash.substring(1)}`).show()
      $('.breadcrumb-link').parent().removeClass('is-active')
      $(`*[href="${window.location.hash}"]`).parent().addClass('is-active')
    }
  },
  dashboardSubmitDomain(){
    $('.domains__submit').addClass('is-loading')
    let domains = $('.domains__entry').val().split("\n");
    domains = domains.map(d =>  d.replace(/,/g, '').trim())
    domains = domains.filter(d => d !== '')
    console.log(domains)
    $.post({
      url: `/dashboard/domains`,
      dataType: 'json',
      data: { domains : JSON.stringify(domains) }
    }, (response) => {
      $('.domains__submit').removeClass('is-loading')
      if(!response.error){
        $('.current__domains').empty()
        domains.forEach((domain) => {
          $('.current__domains').append(`<div class="domain"><span class="tag is-dark">${domain}</span></div>`)
        })
      }
    })
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
          <td><a href="/viewer/steem-post${posts[i].url}" target="_blank"> ${posts[i].title}</a></td>
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
    $('.domains__submit').on('click', (e) => {
        app.dashboardSubmitDomain()
    })

    $('.breadcrumb-link').on('click', (e) => {
      $('.breadcrumb-link').parent().removeClass('is-active')
      $(e.currentTarget).parent().addClass('is-active')

      let pane = $(e.currentTarget).data('pane')
      $('.pane').hide()
      $(`.pane__${pane}`).show()

      if(pane === 'generator') $('.embed-code').empty()
    })

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

    $('.generate-embded').on('click', () => {
      let permlink = app.linkToPermlink( $('.generate-url').val() )
      let controls = { values: true, rep: true, profile: true, generated: false }
      if (permlink) app.dashboadLoadEmbed(permlink, controls)
    })

    $('.dashboard').on('change', '.embed-control', (e) => {
      let controller = $(e.currentTarget).data('controller')
      let permlink;
      if (controller == 'overlay') {
         permlink = $('.overlay').data('permlink')
      } else {
         permlink = app.linkToPermlink( $('.generate-url').val())
      }
      let controls = {
        values: $(`.${controller} *[data-value="votes"]`).is(':checked'),
        rep: $(`.${controller} *[data-value="reputation"]`).is(':checked'),
        profile: $(`.${controller} *[data-value="profile"]`).is(':checked')
      }
      console.log(controls)
      app.dashboadLoadEmbed(permlink, controls)
    })
    $('.overlay__bg').on('click', (e) => {
      $('.overlay').removeClass('--is-active')
    })
    $('.new-thread').on('click', () => {
      $('.new-thread').addClass('is-loading')
      let title = $('.new-thread-title').val().trim()
      app.dashboardNewThread(title)
    })
  },
  linkToPermlink(link){
    let input = link.trim().split('/')
    let slug = input.pop()
    let author = input.pop()
    let cat = input.pop()
    return `/${cat}/${author}/${slug}`
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
  },
  dashboardNewThread:(title) => {
      $.post({
        url: `/new-thread`,
        dataType: 'json',
        data: { title : title }
      }, (response) => {
        console.log(response)
        $('.new-thread').removeClass('is-loading')
        $('.no-custom-threads').parent().remove()
        let template = `<tr>
          <td>${response.title}</td>
          <td><a href="/viewer/custom-thread/finallycomments/@${response.author}/${response.slug}">${response.slug}</a></td>
          <td><button class="button is-dark load-embed" data-permlink="/finallycomments/@${response.author}/${response.slug}" data-generated="true">Generate</button></td>
        </tr>`
        $('.dashboard__table--custom tbody').prepend(template)
      })
  }

}
app.init()
