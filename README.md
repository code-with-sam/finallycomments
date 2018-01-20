# SteemCommentsSystem - Add Steem Comments To Any Website/Blog

Steem comments is a plugin that allows you to add steem comment threads to any website. Include the CSS, JS and dependencies and with one line of HTML you can include any steem comments thread.

Steemcomemnts uses steem-js to load in comment thread and Steemconnects hot linking feature to allow uses to authenticate without needing to trust the website operator where the comments are viewed. 

Comments/Votes act as expect with the addition of needed to supply a username as the viewer is not logged in, when finally clicking post or vote a popup appears for Steemconnect authentication. 


## Example
Vist the example page to try it for yourself

[💯 LIVE EXAMPLE](https://code-with-sam.github.io/s-c-plugin/examples/basic.html) 

## Setup
Comments can be added to any website where you have access to adding custom html. You can download and add these files to your project or link to them directly.

Link the minified CSS in the head of your page.
```
<link rel="stylesheet" href="https://raw.githubusercontent.com/code-with-sam/s-c-plugin/master/dist/steemcomments.min.css">
```

Link the minified JS before the closing body tag.
```
<script src="https://raw.githubusercontent.com/code-with-sam/s-c-plugin/master/dist/steemcomments.min.js"></script>
```

All css and javascript is namesppaced with the prefix ```.sc-``` and ```const steemcomments``` respectively.

### Dependencies
Also link dependencies before steemcomments javascript if your website is not already using them. jQuery, Moment.js, steem-js.
```
<script src="https://cdn.steemjs.com/lib/latest/steem.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.20.1/moment.min.js"></script>
<script src="https://code.jquery.com/jquery-3.2.1.min.js" integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4=" crossorigin="anonymous"></script>

```


created by [@sambillingham](https://steemit.com/@sambillingham)


