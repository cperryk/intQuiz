////////////////
// IntSharing //
////////////////

/**
 * Collection of sharing intents for Slate.com.
 * @type {Object}
 */
define(function(){
  var module = {
  	/**
  	 * Returns the URL of the current page, stripped of parameters.
  	 * @return {string}
  	 */
  	getURL: function() {
  		return $(location).attr('href').indexOf('?') > -1 ? $(location).attr('href').substring(0, $(location).attr('href').indexOf('?')) : $(location).attr('href');
  	},
  	/**
  	 * Opens a window with a provided tweet so the user can tweet it.
  	 * @param  {object} conf - .share_text: Determines the text of the tweet. Required
  	 *                       - .url: The URL to tweet. Defaults to the URL of the current page if not provided.
  	 *                       - .hashtags: An array of hashtags to include (no numeric sign). These will appear
  	 *                       at the end of the tweet. Hashtags can also be included in the share_text.
  	 * @return {null}
  	 */
  	twitterShare: function(conf) {
  		var width = 575,
  			height = 400,
  			left = ($(window).width() - width) / 2,
  			top = ($(window).height() - height) / 2,
  			opts = 'status=1' + ',width=' + width + ',height=' + height + ',top=' + top + ',left=' + left;
  		var share_link_encoded = encodeURIComponent(conf.url||module.getURL());
  		var URL = 'http://twitter.com/intent/tweet?text=' +
  			conf.share_text.replace("hashtag",'%23') +
  			'&url=' + share_link_encoded +
  			(conf.hashtags?('&hashtags='+conf.hashtags.join(',')):'')+
  			(conf.via===false?'':'&via=Slate');
  		window.open(URL, 'twitter', opts);
  	},
  	/**
  	 * Opens a window with a Facebook share prepared for the user.
  	 * To test this, insert this line in your HTML:
  	 * <div id="fb-root"></div><script>window.fbAsyncInit = function(){FB.init({appId:'172274439518228',status:true,xfbml:true});};(function(d, s, id){var js, fjs = d.getElementsByTagName(s)[0];if (d.getElementById(id)) {return;}js = d.createElement(s); js.id = id;js.src = "//connect.facebook.net/en_US/all.js";fjs.parentNode.insertBefore(js, fjs);}(document, 'script', 'facebook-jssdk'));</script>
  	 * @param  {object} conf - .img: The picture that will appear in the share.
  	 *                       - .link: The URL to which the share will link. Defaults to the URL of the current page if not provided.
  	 *                       - .head: The headline of the share.
  	 *                       - .desc: The text that appears under the headline and caption. This often describes what the page is about.
  	 * @return {null}
  	 */
  	facebookShare: function(conf) {
  		//conf.head, conf.img, and conf.desc
  		var obj = {
  			method: 'feed',
  			link: conf.url||module.getURL(),
  			picture: conf.img||'http://slate.com/features/2014/lib/intSharing/graphics/slate_logo.png',
  			name: conf.head,
  			caption: 'Slate.com',
  			description: conf.desc
  		};
      var callback = function(){
  			document.getElementById('msg').innerHTML = "Post ID: " + response.post_id;
  		};
  		FB.ui(obj, callback);
  	},
  	/**
  	 * Opens the user's mail program with a new, pre-composed message
  	 * @param  {object} conf - subject: The subject of the email
  	 *                       - body: The text in the body of the eamil
  	 * @return {null}
  	 */
  	emailShare:function(conf){
  		window.location.href = "mailto:" +
  			"?subject="+escape(conf.subject) +
  			"&body="+escape(conf.body) +
  			window.location;
  	},
    /**
      Prints sharing buttons to a container. Returns the jQuery elements in a dictionary.
    **/
    appendShareBtns:function(container){
      return {
        fb:$('<div>')
          .addClass('intSharing-btn-share')
          .addClass('intSharing-fb-share')
          .append($('<div>').addClass('share-icon'))
          .append($('<div>').addClass('share-label').html('Share'))
          .appendTo(container),
        tw:$('<div>')
          .addClass('intSharing-btn-share')
          .addClass('intSharing-tw-share')
          .append($('<div>').addClass('share-icon'))
          .append($('<div>').addClass('share-label').html('Tweet'))
          .appendTo(container),
        email:$('<div>')
          .addClass('intSharing-btn-share')
          .addClass('intSharing-email-share')
          .append($('<div>').addClass('share-icon'))
          .append($('<div>').addClass('share-label').html('Email'))
          .appendTo(container)
      };
    }
  };
  return module;
});
