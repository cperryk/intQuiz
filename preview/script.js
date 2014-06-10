$(function(){
var INT_PATH = 'http://localhost:9999/2014/05/simple_quiz/preview/';
require.config({
  paths: {
    IntQuizScore: INT_PATH+'lib/intQuizScore',
    IntSharing: INT_PATH+'lib/intSharing/intSharing',
    IntSound: INT_PATH+'lib/intSound',
    imagesLoaded: INT_PATH+'lib/imagesLoaded.min',
    SoundJS:INT_PATH+'lib/soundjs/soundjs-0.5.2.min',
    SJS_FlashPlugin:INT_PATH+'lib/soundjs/FlashPlugin',
    SJS_SwfObject:INT_PATH+'lib/soundjs/swfobject'
  }
});

require(['imagesLoaded'],function(imagesLoaded){
function SimpleQuiz(container, slug, QUIZ_DATA){
  this.QUIZ_DATA = QUIZ_DATA;
  this.slug = slug;
  this.container = container;
  this.user = {score:0};
  this
    .initialize()
    .goToLocation(0);
}
SimpleQuiz.prototype = {
  initialize:function(){
    var self = this;
    (function printTopBar(){
      var wrapper = $('<div>')
        .addClass('top_bar');
      var title = $('<div>')
        .addClass('quiz_title')
        .html(self.QUIZ_DATA.title || 'Quiz')
        .appendTo(wrapper);
      self.nav = new Nav(wrapper, self);
      self.top = wrapper.appendTo(self.container);
    })();
    (function printInner(){
      self.inner = $('<div>')
        .addClass('quiz_inner')
        .appendTo(self.container);
    }());
    this.makeQuestions();
    this.printAttribution();
    return this;
  },
  clear:function(){
    this.inner.empty();
    return this;
  },
  makeQuestions:function(){
    var self = this;
    this.questions = [];
    var questions_data = this.QUIZ_DATA.questions;
    if(this.QUIZ_DATA.randomize_questions==="true"){
      shuffleArray(questions_data);
    }
    questions_data.forEach(function(question_data, question_index){
      self.questions.push(new Question(question_data, question_index+1, self));
    });
    return this;
  },
  advanceOne:function(){
    this.goToLocation(this.current_location+1);
    return this;
  },
  backOne:function(){
    this.goToLocation(this.current_location-1);
    return this;
  },
  printQuestion:function(question_index){
    this.clear();
    this.questions[question_index].build(this.inner);
    return this;
  },
  goToLocation:function(location_index){
    var self = this;
    if(this.IntSound_used){
      require(['IntSound'],function(IntSound){
        IntSound.stopAll();
      });
    }
    this.inner
      .stop(true,true)
      .fadeTo(200,0,function(){
        if(location_index===0 && self.QUIZ_DATA.title_slide === 'true'){
          self.printTitleSlide();
        }
        else if(location_index < (self.questions.length + (self.QUIZ_DATA.title_slide==="true"?1:0))){
            self.printQuestion(location_index - (self.QUIZ_DATA.title_slide==="true"?1:0));
        }
        else{
            self.end();
        }
        self.current_location = location_index;
        self.nav.update();
        self.jumpToTop();
        self.inner.imagesLoaded(function(){
          self.inner.fadeTo(200,1);
        });
      });
    return self;
  },
  jumpToTop:function(){
    // Return to the top of the interactive
    if($(window).height()<this.container.height()){
      $('html, body').css('scrollTop',this.container.offset().top-$('#article_rollup').height());
    }
  },
  end:function(){
    var self = this;
    this.clear();
    var end_wrapper = $('<div>')
      .addClass('end_wrapper')
      .appendTo(this.inner);
    (function printCompletionText(){
      return $('<div>')
        .addClass('completion_text')
        .html(self.QUIZ_DATA.completion_text || 'Complete!')
        .appendTo(end_wrapper);
    })();
    var score_wrapper = $('<div>')
      .addClass('score_wrapper')
      .appendTo(end_wrapper);
    if(this.QUIZ_DATA.matcher){
      printMatchEnd();
    }
    else{
      printScoreEnd();
    }
    (function printTeaser(){
      if(!self.QUIZ_DATA.teaser){
        return;
      }
      $('<div>')
        .addClass('teaser')
        .html(self.QUIZ_DATA.teaser)
        .appendTo(end_wrapper);
    })();

    function printMatchEnd(){
      var matcher_data = self.QUIZ_DATA.matcher;
      var best_result = getBestResult();
      (function printResult(){
        var result_wrapper = $('<div>')
          .addClass('quiz_result')
          .appendTo(score_wrapper);
        var matcher_end = $('<div>')
          .addClass('matcher_end')
          .html(matcher_data.end_text+':')
          .appendTo(result_wrapper);
        var matcher_result = $('<div>')
          .addClass('matcher_result')
          .html(best_result.content)
          .appendTo(result_wrapper);
        if(best_result.img){
          var img = $('<img>')
            .attr('src',INT_PATH+'quizzes/'+self.slug+'/img/'+best_result.img)
            .prependTo(result_wrapper);
        }
        if(best_result.descriptor){
          $('<div>')
            .addClass('descriptor')
            .html(best_result.descriptor)
            .appendTo(result_wrapper);
        }
        if(best_result.youtube){
          var youtube = $('<iframe allowfullscreen>')
            .attr('src','//www.youtube.com/embed/'+best_result.youtube)
            .attr('frameborder',0)
            .insertAfter(matcher_end);
          youtube.css('height',parseInt((315*youtube.width())/560,10));
        }
      })();
      var share_text = getShareText();
      printShareBtns({
        facebook:share_text.facebook,
        twitter:share_text.twitter+' Check out @Slate\'s "'+self.QUIZ_DATA.title+'" quiz',
        email:share_text.email+' Check out Slate\'s "'+self.QUIZ_DATA.title+'" quiz'
      });
      function getShareText(){
        if(best_result.share_text){
          return {
            facebook:best_result.share_text,
            twitter:best_result.share_text,
            email:best_result.share_text
          };
        }
        else{
          return {
            facebook:matcher_data.share_text.replace('%s',best_result.content),
            twitter:matcher_data.share_text.replace('%s',best_result.content),
            email:matcher_data.share_text.replace('%s',best_result.content)
          };
        }
      }
      function getBestResult(){
        var results = $.extend({},matcher_data.results);
        if(typeof results !== 'object'){
          for(var i in results){
            results[i] = {content:results[i],score:0};
          }
        }
        for(var a in results){
          results[a].score = 0;
        }
        var best_result;
        (function addScores(){
          self.questions.forEach(function(question){
            for(var i in question.selected_choice.data.results){
              results[i].score += parseFloat(question.selected_choice.data.results[i]);
            }
          });
        }());
        (function getMax(){
          for(var i in results){
            if(best_result === undefined){
              best_result = results[i];
            }
            else{
              if(results[i].score > best_result.score){
                best_result = results[i];
              }
            }
          }
        }());
        return best_result;
      }
    }
    function printScoreEnd(){
      var result_wrapper = (function printScoreText(){
        return $('<div>')
          .addClass('quiz_result')
          .html('You scored <strong>'+self.user.score+'</strong> out of '+self.questions.length+'!')
          .appendTo(score_wrapper);
      })();
      var average_score = (function printAverageScore(){
        var average_score_wrapper = $('<div>')
          .addClass('average_score')
          .hide()
          .insertAfter(result_wrapper);
        require(['IntQuizScore'],function(IntQuizScore){
          IntQuizScore.getAverage(self.slug,function(average_score){
            if(average_score!==undefined){
              average_score_wrapper
                .html('The average score was <strong>'+average_score+'</strong>.')
                .slideDown();
            }
          });
        });
        return average_score_wrapper;
      })();
      (function sendScore(){
        require(['IntQuizScore'],function(IntQuizScore){
          IntQuizScore.sendScore(self.slug,self.user.score);
        });
      })();
      var share_name = self.QUIZ_DATA.share_name?self.QUIZ_DATA.share_name:('"'+self.QUIZ_DATA.title+'" quiz!');
      printShareBtns({
        facebook:'I scored '+self.user.score+' out of '+self.questions.length+' on Slate\'s '+share_name,
        twitter:'I scored '+self.user.score+' out of '+self.questions.length+' on @Slate\'s '+share_name,
        email:'I scored '+self.user.score+' out of '+self.questions.length+' on Slate\'s '+share_name
      });
    }
    function printShareBtns(share_strings){
      function parseShareString(string){
        if(!string){
          return false;
        }
        return string.replace('%score',self.user.score).replace('%question_length',self.questions.length);
      }
      var share_data = self.QUIZ_DATA.share;
      if(share_data){
        if(share_data.facebook){
          share_strings.facebook = parseShareString(share_data.facebook);
        }
        if(share_data.twitter){
          share_strings.twitter = parseShareString(share_data.twitter);
        }
        if(share_data.email){
          share_strings.email = parseShareString(share_data.email);
        }
      }
      require(['IntSharing'],function(IntSharing){
        var share_btns_wrapper = $('<div>')
          .addClass('share_btns')
          .appendTo(score_wrapper)
          .click(function(){
            self.restart();
          });
        $('<div>')
          .addClass('intSharing_btn_share btn_restart')
          .append($('<div>').addClass('share_icon'))
          .append($('<div>').addClass('share_label').html('Restart'))
          .appendTo(share_btns_wrapper);
        var btns = IntSharing.appendShareBtns(share_btns_wrapper);
        btns.fb.click(function(){
            IntSharing.facebookShare({
              head:share_strings.facebook,
              desc:self.QUIZ_DATA.fb_description || self.QUIZ_DATA.description,
              img:self.QUIZ_DATA.thumbnail
            });
          });
        btns.tw.click(function(){
          IntSharing.twitterShare({
            share_text:share_strings.twitter,
            via:false
          });
        });
        btns.email.click(function(){
          IntSharing.emailShare({
            subject:'Slate\'s '+self.QUIZ_DATA.title,
            body:share_strings.email+': '+IntSharing.getURL()
          });
        });
      });
    }
  },
  restart:function(){
    this.questions.forEach(function(question){
      question.answered = false;
      delete question.selected_choice;
    });
    this.goToLocation(0);
  },
  printTitleSlide:function(){
    this.clear();
    var self = this;
    var wrapper = $('<div>')
      .addClass('title_slide');
    var title = $('<div>')
      .addClass('quiz_title')
      .html(this.QUIZ_DATA.title)
      .appendTo(wrapper);
    var desc = $('<div>')
      .addClass('quiz_desc')
      .html(this.QUIZ_DATA.description)
      .appendTo(wrapper);
    var btn_go = $('<div>')
      .addClass('btn_go')
      .appendTo(wrapper)
      .click(goClicked);
    wrapper.appendTo(this.inner);
    function goClicked(){
      self.advanceOne();
    }
  },
  printAttribution:function(){
    $('<p>')
      .addClass('int_attribution')
      .html('Quiz template by <a href="https://twitter.com/chrkirk">Chris Kirk</a>.'+(this.QUIZ_DATA.attribution?' '+this.QUIZ_DATA.attribution:''))
      .insertAfter(this.container);
    return this;
  },
  appendSoundBtn:function(target_container,sound_data,callback){
    var self = this;
    var btn_wrapper = $('<div>')
      .addClass('btn_sound_wrapper')
      .prependTo(target_container);
    var btn = $('<div>')
      .addClass('btn_sound')
      .prependTo(btn_wrapper);
    (function addSoundListener(){
      if(getIEversion()===8){
        require(['SoundJS','SJS_FlashPlugin','SJS_SwfObject','IntSound'],function(SoundJS,FlashPlugin,SwfObject,IntSound){
          IntSound.initialize(INT_PATH+'lib/soundjs');
          go(IntSound);
        });
      }
      else{
        require(['SoundJS','IntSound'],function(SoundJS,IntSound){
          go(IntSound);
        });
      }
    }());
    function go(IntSound){
      self.IntSound_used = true;
      var sound_id = (typeof sound_data === 'object' ? sound_data.id : sound_data);
      IntSound.tieToButton(btn,INT_PATH+'quizzes/'+self.slug+'/sound/',sound_id);
      if(typeof sound_data === 'object' && sound_data.autoplay === "true"){
        btn.trigger('click');
      }
    }
    return btn;
  }
};

function Nav(target_container,parent){
  this.par = parent;
  this.container = $('<div>')
    .addClass('quiz_nav');
  this.left_arr = $('<div>')
    .addClass('arr')
    .html('&#8592;')
    .appendTo(this.container);
  this.location_readout = $('<div>')
    .addClass('location_readout')
    .appendTo(this.container);
  this.right_arr = $('<div>')
    .addClass('arr')
    .html('&#8594;')
    .appendTo(this.container);
  this.container.appendTo(target_container);
  this.addEventListeners();
}
Nav.prototype = {
  update: function(){
    this.updateArrows();
    this.updateLocationText();
  },
  updateArrows: function(){
    var location = this.par.current_location;
    var question_count = this.par.questions.length;
    var title_slide = this.par.QUIZ_DATA.title_slide;
    this.left_arr
      .add(this.right_arr)
      .addClass('inactive');
    if(location!==0){
      this.left_arr
        .removeClass('inactive');
    }
    if(location === 0 && title_slide==="true"){
      this.right_arr
        .removeClass('inactive');
    }
    else if(location !== this.par.questions.length + (title_slide==="true"?1:0)){
      if(this.par.questions[location-(title_slide==="true"?1:0)].answered){
        this.right_arr
          .removeClass('inactive');
      }
    }
    return this;
  },
  updateLocationText: function(){
    var location = this.par.current_location;
    var location_string;
    var title_slide = this.par.QUIZ_DATA.title_slide;
    if(location === 0 && title_slide==="true"){
      location_string = 'Title';
    }
    else if(location === this.par.questions.length + (title_slide==="true"?1:0)){
      location_string = 'End';
    }
    else{
      location_string = 'Question <strong>'+(location+(title_slide==="true"?0:1))+'</strong> of '+this.par.questions.length;
    }
    this.location_readout.html(location_string);
  },
  addEventListeners: function(){
    var self = this;
    this.right_arr.click(function(){
      if(!$(this).hasClass('inactive')){
        self.par.advanceOne();
      }
    });
    this.left_arr.click(function(){
      if(!$(this).hasClass('inactive')){
        self.par.backOne();
      }
    });
  }
};

function Question(question_data,question_number,parent){
  this.data = question_data;
  this.choices = [];
  this.question_number = question_number;
  this.par = parent;
}
Question.prototype = {
  build:function(target_container){
    this.container = $('<div>')
      .addClass('question_wrapper')
      .appendTo(target_container)
      .hide();
    this
      .printQuestionContent()
      .printChoices();
    if(this.answered){
      this.reflectChoice();
    }
    this.container.fadeIn();
  },
  printQuestionContent:function(){
    var self = this;
    var question_wrapper = $('<div>')
      .addClass('question');
    var question_content = $('<div>')
      .addClass('question_content')
      .appendTo(question_wrapper);
    var question_number = $('<span>')
      .addClass('question_number')
      .html(this.question_number+'. ')
      .appendTo(question_content);
    var question_text = $('<span>')
      .html(this.data.content || this.par.question.content)
      .appendTo(question_content);
    question_wrapper.appendTo(this.container);
    (function adjustFontSize(){
      if(self.data.content.length < 15){
        question_wrapper.addClass('big');
      }
    })();
    (function printSound(){
      if(self.data.sound){
        question_wrapper.addClass('with_sound');
        self.par.appendSoundBtn(question_wrapper, self.data.sound);
      }
    })();
    return this;
  },
  printChoices:function(){
    var self = this;
    var choices_data = getChoicesToPrint();
    var choice_wrapper = $('<div>')
      .addClass('choices'+(self.par.QUIZ_DATA.blocked_choices=="true"?' blocked':''))
      .appendTo(this.container);
    this.getExcludedChoices();
    writeHTML();
    if(self.par.QUIZ_DATA.blocked_choices=="true"){
      waitForWebfonts(['sl-ApresRegular'],function(){
        equalizeChoiceHeights();
      });
    }
    function writeHTML(){
      var target_wrapper = choice_wrapper;
      choices_data.forEach(function(choice_data,i){
        if(self.choices[i]){
          self.choices[i].build(target_wrapper);
        }
        else{
          self.printChoice(choice_data,i,target_wrapper);
        }
      });
    }
    function equalizeChoiceHeights(){
      choice_wrapper.imagesLoaded(function(){
        var max_height = 0;
        self.choices.forEach(function(choice){
          if(choice.container.height()>max_height){
            max_height = choice.container.height();
          }
        });
        self.choices.forEach(function(choice){
          choice.container.css('height',max_height);
        });
      });
    }
    function getChoicesToPrint(){
      if(self.data.choices){
        if(typeof self.data.choices === 'string' || typeof self.data.choices === 'number'){
          return self.par.QUIZ_DATA.choices[self.data.choices];
        }
        else{
          return self.data.choices;
        }
      }
      else{
        return self.par.QUIZ_DATA.choices;
      }
    }
  },
  printChoice:function(choice_data,choice_index,target_container){
    this.choices.push(new Choice(choice_data,choice_index,target_container,this));
  },
  getExcludedChoices:function(){
    var self = this;
    if(this.par.QUIZ_DATA.exclusionary_choices!=="true" || !this.par.QUIZ_DATA.choices){
      return;
    }
    var exclusions = [];
    var questions = this.par.questions;
    for(var i=0;i<questions.length;i++){
      if(questions[i]===self){
        break;
      }
      exclusions.push(questions[i].data.correct);
    }
    if(exclusions.length > 0){
      this.exclusions = exclusions;
    }
    else{
      this.exclusions = false;
    }
    return this;
  },
  choiceClicked:function(choice){
    var rechoosing = false;
    if(this.selected_choice){
      this.container.find('.btn_next').remove();
      this.choices.forEach(function(choice){
        choice.unmark();
      });
      rechoosing = true;
    }
    if(!choice.validity || choice.validity==='true'){
      this.par.user.score++;
    }
    this.answered = true;
    this.selected_choice = choice;
    if(this.par.QUIZ_DATA.auto_advance==="true" && !rechoosing){
      this.reflectChoice(choice, true);
      this.par.advanceOne();
    }
    else{
      this.reflectChoice(choice);
    }
  },
  reflectChoice:function(choice, no_bottom){
    var self = this;
    choice = choice || this.selected_choice;
    this.validity = choice.validity;
    if(this.par.QUIZ_DATA.matcher){
      choice.markCorrect();
    }
    else if(!choice.validity || choice.validity!=="true"){
      choice.markIncorrect();
    }
    if(this.selected_choice){
      this.container.find('.choice_bottom').remove();
    }
    var choice_bottom = $('<div>')
      .addClass('choice_bottom')
      .hide()
      .appendTo(this.container);
    this
      .markCorrectChoice()
      .printLoader()
      .printFeedback(choice_bottom,function(){
        self
          .removeLoader()
          .printNextBtn(choice_bottom);
        choice_bottom
          .imagesLoaded(function(){
            if(!no_bottom){
              choice_bottom.slideDown();
            }
          });
      });
    if(!this.par.QUIZ_DATA.matcher){
      this.deactivateChoices();
      this.container.addClass('answered');
    }
    this.par.nav.updateArrows();
  },
  deactivateChoices:function(){
    this.choices.forEach(function(choice){
      choice.container.unbind('click');
    });
    return this;
  },
  markCorrectChoice:function(){
    this.choices.forEach(function(choice){
      if(choice.validity=="true"){
        choice.markCorrect();
      }
    });
    return this;
  },
  printLoader:function(){
    this.loader = new IntLoader(this.container,'Loading answer...',500);
    return this;
  },
  removeLoader:function(){
    if(this.loader){
      this.loader.kill();
    }
    return this;
  },
  printFeedback:function(target, callback){
    if(!this.data.feedback){
      callback();
      return this;
    }
    var self = this;
    this.feedback = new Feedback(target,this.data.feedback,this,function(){
      if(callback){
        callback();
      }
    });
    return this;
  },
  printNextBtn:function(target){
    var self = this;
    $('<div>')
      .addClass('btn_next')
      .appendTo(target)
      .click(function(){
        self.par.advanceOne();
      });
  }
};

function Choice(choice_data,choice_index,target_container,parent){
  var self = this;
  this.choice_index = choice_index;
  this.data = choice_data;
  this.par = parent;
  this.build(target_container);
}
Choice.prototype = {
  build:function(target_container){
    var self = this;
    this.container = $('<div>')
      .data('choice_index',this.choice_index)
      .addClass('choice')
      .appendTo(target_container);
    this.inner = $('<div>')
      .addClass('inner')
      .appendTo(this.container);
    this.recordValidity();
    if(this.par.exclusions && this.par.exclusions.length > 0 && this.par.exclusions.indexOf(this.data.id)>-1){
      this.container.addClass('excluded');
    }
    else{
      this.container.click(function(e){
        if($(e.target).hasClass('btn_sound')){
          return;
        }
        self.par.choiceClicked(self);
      });
    }
    if(this.data.img){
      this.printImg();
    }
    var content_wrapper = $('<p>')
      .addClass('choice_content')
      .html(this.data.content);
    if(this.data.sound){
      var sound_content_wrapper = $('<div>')
        .addClass('sound_content');
      this.printSound(sound_content_wrapper);
      content_wrapper.appendTo(sound_content_wrapper);
      sound_content_wrapper.appendTo(this.inner);
    }
    else{
      content_wrapper.appendTo(this.inner);
    }
    if(this.par.par.QUIZ_DATA.blocked_choices === "true"){
      this.container.addClass('blocked');
    }
  },
  markCorrect:function(){
    this.container.addClass('correct');
  },
  markIncorrect:function(){
    this.container.addClass('incorrect');
  },
  unmark:function(){
    this.container
      .removeClass('correct')
      .removeClass('incorrect');
  },
  printImg:function(){
    var src = this.data.img;
    var self = this;
    $('<img>')
      .addClass('choice_img')
      .attr('src',INT_PATH+'quizzes/'+this.par.par.slug+'/img/'+src)
      .appendTo(self.inner);
    this.container.addClass('with_img');
  },
  printSound:function(target){
    var self = this;
    this.container.addClass('with_sound');
    var btn = this.par.par.appendSoundBtn(target,this.data.sound);
    btn.hover(function(){
      self.container.addClass('no_highlight');
    },function(){
      self.container.removeClass('no_highlight');
    });
    return this;
  },
  recordValidity:function(){
    if(this.data.validity){
      this.validity = this.data.validity;
      return this;
    }
    if(this.par.data.correct){
      var correct_choice_ids = this.par.data.correct;
      if(typeof correct_choice_ids === 'string'){
        correct_choice_ids = [correct_choice_ids];
      }
      var validity = correct_choice_ids.indexOf(this.data.id)>-1;
      this.validity = validity.toString();
    }
    return this;
  }
};

function Feedback(target,data,parent,callback){
  this.par = parent;
  this.data = data;
  this.build(target,callback);
}
Feedback.prototype = {
  build:function(target,callback){
    var self = this;
    this.container = $('<div>')
      .addClass('feedback');
    $('<p>')
      .addClass('feedback_content')
      .html(this.getFeedbackText())
      .appendTo(this.container);
    this.printFeedbackImage(function(){
      self.container.appendTo(target);
      if(callback){
        callback();
      }
    });
  },
  getFeedbackText:function(){
    var s = '';
    if(typeof this.data === 'string'){
      s+=this.data;
    }
    else if(typeof this.data === 'object'){
      s+=this.data.content;
    }
    if(this.par.validity==='true'){
      s='<span class="correct">Correct!</span> '+s;
    }
    else{
      s='<span class="incorrect">Incorrect.</span> '+s;
    }
    return s;
  },
  printFeedbackImage:function(callback){
    if(typeof this.data !== 'object' || !this.data.img){
      if(callback){
        callback();
      }
      return this;
    }
    var self = this;
    var img_data = this.data.img;
    var url = getImgURL();
    var wrapper = $('<div>')
      .addClass('img_wrapper');
    var img = $('<img>')
      .attr('src',url);
    img.load(function(){
        placeImg();
        placeCredit();
        callback();
      });
    return this;

    function placeImg(){
      img
        .removeAttr('width height') // because IE adds width and height attributes that force the image to appear at its actual dimensions
        .appendTo(wrapper);
      if(img_data.position){
        if(img_data.position === 'top'){
          wrapper.prependTo(self.container);
        }
        else{
          wrapper.appendTo(self.container);
        }
      }
      else{
        wrapper.appendTo(self.container);
      }
      wrapper.css('display','inline-block');
    }
    function placeCredit(){
      if(img_data.credit || img_data.caption){
        $('<p>')
          .addClass('caption')
          .html(img_data.credit)
          .appendTo(wrapper);
      }
    }
    function getImgURL(){
      var url = INT_PATH+'quizzes/'+self.par.par.slug+'/img/';
      if(typeof img_data === 'object'){
        url += img_data.src;
      }
      else{
        url += img_data;
      }
      return url;
    }
  }
};

function createQuiz(container,slug){
  var url = INT_PATH+'quizzes/'+slug+'/'+slug+'.json';
  var loader = new IntLoader(container,'Loading interactive',200);
  $.getJSON(url,function(quiz_data){
    loader.kill();
    var my_interactive = new SimpleQuiz(container,slug,quiz_data);
  });
}

$('.simple_quiz').each(function(){
  createQuiz($(this), $(this).data('slug'));
});

});

function IntLoader(target,text,delay){
  var self = this;
  this.timeout = setTimeout(print,delay);
  function print(){
    self.container = $('<div>')
      .addClass('int_loader')
      .append('<img src="'+INT_PATH+'graphics/ajax-loader.gif"/>')
      .append(text)
      .appendTo(target);
  }
  return this;
}
IntLoader.prototype = {
  kill:function(){
    if(this.container){
      this.container.remove();
    }
    if(this.timeout){
      clearTimeout(this.timeout);
    }
  }
};

function getIEversion(){
  var undef,
      v = 3,
      div = document.createElement('div'),
      all = div.getElementsByTagName('i');
  while (
      div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i>< ![endif]-->',
      all[0]
  );
  return v > 4 ? v : undef;
}

}); //end jQuery



/* jshint ignore:start */
// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.com/#x15.4.4.18
if (!Array.prototype.forEach) {

  Array.prototype.forEach = function (callback, thisArg) {

    var T, k;

    if (this === null) {
      throw new TypeError(" this is null or not defined");
    }

    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (typeof callback !== "function") {
      throw new TypeError(callback + " is not a function");
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (thisArg) {
      T = thisArg;
    }

    // 6. Let k be 0
    k = 0;

    // 7. Repeat, while k < len
    while (k < len) {

      var kValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[k];

        // ii. Call the Call internal method of callback with T as the this value and
        // argument list containing kValue, k, and O.
        callback.call(T, kValue, k, O);
      }
      // d. Increase k by 1.
      k++;
    }
    // 8. return undefined
  };
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement, fromIndex) {
      if ( this === undefined || this === null ) {
        throw new TypeError( '"this" is null or not defined' );
      }

      var length = this.length >>> 0; // Hack to convert object.length to a UInt32

      fromIndex = +fromIndex || 0;

      if (Math.abs(fromIndex) === Infinity) {
        fromIndex = 0;
      }

      if (fromIndex < 0) {
        fromIndex += length;
        if (fromIndex < 0) {
          fromIndex = 0;
        }
      }

      for (;fromIndex < length; fromIndex++) {
        if (this[fromIndex] === searchElement) {
          return fromIndex;
        }
      }

      return -1;
    };
  }

function shuffleArray(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

if(!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}
function waitForWebfonts(fonts, callback) {
  var loadedFonts = 0;
  for(var i = 0, l = fonts.length; i < l; ++i) {
    (function(font) {
      var node = document.createElement('span');
      // Characters that vary significantly among different fonts
      node.innerHTML = 'giItT1WQy@!-/#';
      // Visible - so we can measure it - but not on the screen
      node.style.position      = 'absolute';
      node.style.left          = '-10000px';
      node.style.top           = '-10000px';
      // Large font size makes even subtle changes obvious
      node.style.fontSize      = '300px';
      // Reset any font properties
      node.style.fontFamily    = 'sans-serif';
      node.style.fontVariant   = 'normal';
      node.style.fontStyle     = 'normal';
      node.style.fontWeight    = 'normal';
      node.style.letterSpacing = '0';
      document.body.appendChild(node);

      // Remember width with no applied web font
      var width = node.offsetWidth;

      node.style.fontFamily = font;

      var interval;
      function checkFont() {
        // Compare current width with original width
        if(node && node.offsetWidth != width) {
          ++loadedFonts;
          node.parentNode.removeChild(node);
          node = null;
        }

        // If all fonts have been loaded
        if(loadedFonts >= fonts.length) {
          if(interval) {
            clearInterval(interval);
          }
          if(loadedFonts == fonts.length) {
            callback();
            return true;
          }
        }
      };

      if(!checkFont()) {
        interval = setInterval(checkFont, 50);
      }
    })(fonts[i]);
  }
};
