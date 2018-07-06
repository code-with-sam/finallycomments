
<<<<<<< HEAD
## Finally comments - V0.12.0
=======
## Finally comments - V0.11.1
>>>>>>> master
Finally is a comments system for your website that is powered by the STEEM blockchain. The STEEM blockchain is a unique piece of technology that allows content creators to receive a share of weekly token rewards.

Finally aims to provide monetisation to blogs and foster discussions with the incentives the STEEM blockchain provides.

### Get Started
[Please visit the site for more details](http://finallycomments.com)

Finally provides both HTML embed code and a javascript library. The HTML embed can be easily added to any website while the Javascript library enables advanced options for developers.

Finally uses Steemconnect to allow users to post and upvote content. Once authenticated users will not have to log in again when visiting other sites that also use Finally.

The fastest way to embed any of your recent comment threads from Steemit.com, Busy.org or any STEEM based platform is to login to our dashboard where you can see a complete list of your recent posts. From the Dashboard you can generate the embed code for any post with one click.


Login to the dashboard at [http://finallycomments.com](http://finallycomments.com/auth/dashboard). To generate code for any Steemit(or any other STEEM based platform) post with one click.

```
  <section class="finally-comments" data-id="https://utopian.io/utopian-io/@sambillingham/tutorial-beginner-friendly-build-your-first-steem-bot-in-javascript-30minutes"></section>
  <script src="https://finallycomments.com/js/finally.min.js"></script>

```

Finally uses Steemconnect authentication to allow users to post comments and upvotes directly from anywhere Finally is embeded. Once authenticated with Finally users will not have to log in again when visiting other sites that also use Finally.

### Development Setup
You'll need to create an account on steemconnect.com to work on this project (current cost 3 STEEM). Use the details within the finallycomments app. Make sure the redirect url matches.

start by passing enviroment variables to the node process for example
```
git clone
cd app/
npm install
npm run dev
NODE_CLIENT_ID="newproject.app" NODE_REDIRECT_URI="localhost:3000/auth/" NODE_SESSION_SECRET="supersecret27" node ./bin/www
```

### Feature Roadmap
- stats for threads/account
- auto hide posts from rep less than X
- edit/delete/flag comments
- Themes
- How To Guides
- Beneficiaries
- Improve Profiles - @username
- Flag comments using STEEM downvote
- wordpress plugin
