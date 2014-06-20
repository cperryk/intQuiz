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
		this.makeSlides();
		this.printAttribution();
		return this;
	},
	clear:function(){
		this.inner.empty();
		return this;
	},
	makeSlides:function(){
		var self = this;
		this.slides = [];
		var slides_data = this.QUIZ_DATA.slides;
		if(this.QUIZ_DATA.randomize_questions){
			shuffleArray(slides_data);
		}
		slides_data.forEach(function(slide_data, slide_index){
			self.slides.push(new Slide(slide_data, slide_index+1, self));
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
	printSlide:function(slide_index){
		this.clear();
		this.slides[slide_index].build(this.inner);
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
				if(location_index===0 && self.QUIZ_DATA.title_slide){
					self.printTitleSlide();
				}
				else if(location_index < (self.slides.length + (self.QUIZ_DATA.title_slide?1:0))){
						self.printSlide(location_index - (self.QUIZ_DATA.title_slide?1:0));
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
					var youtube_wrapper = $('<div>').insertAfter(matcher_end);
					var youtube = new YouTube(best_result.youtube, youtube_wrapper);
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
					self.slides.forEach(function(question){
						for(var i in question.responder.selected_choice.data.results){
							results[i].score += parseFloat(question.responder.selected_choice.data.results[i]);
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
					.html('You scored <strong>'+self.user.score+'</strong> out of '+self.slides.length+'!')
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
				facebook:'I scored '+self.user.score+' out of '+self.slides.length+' on Slate\'s '+share_name,
				twitter:'I scored '+self.user.score+' out of '+self.slides.length+' on @Slate\'s '+share_name,
				email:'I scored '+self.user.score+' out of '+self.slides.length+' on Slate\'s '+share_name
			});
		}
		function printShareBtns(share_strings){
			function parseShareString(string){
				if(!string){
					return false;
				}
				return string.replace('%score',self.user.score).replace('%question_length',self.slides.length);
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
					.appendTo(score_wrapper);
				$('<div>')
					.addClass('intSharing_btn_share btn_restart')
					.append($('<div>').addClass('share_icon'))
					.append($('<div>').addClass('share_label').html('Restart'))
					.appendTo(share_btns_wrapper)
					.click(function(){
						self.restart();
					});
				var btns = IntSharing.appendShareBtns(share_btns_wrapper);
				btns.fb.click(function(){
						IntSharing.facebookShare({
							head:share_strings.facebook,
							desc:self.QUIZ_DATA.fb_description || self.QUIZ_DATA.description,
							img:self.QUIZ_DATA.thumbnail || $('link[rel="image_src"]').attr('href')
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
		this.makeSlides();
		this.goToLocation(0);
		if(this.user){
			if(this.user.score){
				this.user.score = 0;
			}
		}
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
			.html('Interactive by <a href="https://twitter.com/chrkirk">Chris Kirk</a>.'+(this.QUIZ_DATA.attribution?' '+this.QUIZ_DATA.attribution:''))
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
			if(typeof sound_data === 'object' && sound_data.autoplay){
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
		var title_slide = this.par.QUIZ_DATA.title_slide;
		this.left_arr
			.add(this.right_arr)
			.addClass('inactive');
		if(location!==0){
			this.left_arr
				.removeClass('inactive');
		}
		if(location === 0 && title_slide){
			this.right_arr
				.removeClass('inactive');
		}
		else if(location !== this.par.slides.length + (title_slide?1:0)){
			if(this.par.slides[location-(title_slide?1:0)].answered){
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
		if(location === 0 && title_slide){
			location_string = 'Title';
		}
		else if(location === this.par.slides.length + (title_slide?1:0)){
			location_string = 'End';
		}
		else{
			location_string = 'Question <strong>'+(location+(title_slide?0:1))+'</strong> of '+this.par.slides.length;
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

function Slide(slide_data,slide_number,parent){
	this.data = slide_data;
	this.slide_number = slide_number;
	this.par = parent;
}
Slide.prototype = {
	build:function(target_container){
		var self = this;
		this.container = $('<div>')
			.addClass('slide_wrapper')
			.appendTo(target_container)
			.hide();
		self.container
			.css('opacity',0)
			.show();
		if(this.responder){
			this.responder.build();
		}
		else{
			switch(this.data.type){
				case undefined:
					this.responder = new ChoiceGroup(this,this.data.choices);
					break;
				case 'fill_in_the_blank':
					this.responder = new FillInTheBlank(this,this.data.correct);
					break;
			}
		}
		this
			.printSlideContent(function(){
				self.container
					.css('opacity',1);
			});
	},
	printSlideContent:function(callback){
		var self = this;
		var loader =  new IntLoader(this.container,'Loading question...',250);
		var question = question_wrapper = $('<div>')
			.addClass('question');
		var question_content = $('<div>')
			.addClass('question_content')
			.appendTo(question_wrapper);
		var main_text = $('<p>')
			.addClass('main_text')
			.appendTo(question_content);
		var slide_number = $('<span>')
			.addClass('slide_number')
			.html(this.slide_number+'. ')
			.appendTo(main_text);
		var question_text = $('<span>')
			.html(this.data.content || this.par.question.content)
			.appendTo(main_text);
		question_wrapper
			.hide()
			.prependTo(this.container);
		question_wrapper.imagesLoaded(function(){
			question_wrapper.show();
			loader.kill();
			if(callback){
				callback();
			}
		});
		this.question_wrapper = question_wrapper;
		(function printSub(){
			if(self.data.sub){
				$('<p>')
					.html(self.data.sub)
					.addClass('sub_text')
					.appendTo(question_content);
			}
		})();
		(function printImg(){
			if(self.data.img){
				var img_wrapper = $('<div>')
					.addClass('img_wrapper')
					.prependTo(question_wrapper);
				$('<img>')
					.attr('src',INT_PATH+'quizzes/'+self.par.slug+'/img/'+self.data.img)
					.prependTo(img_wrapper);
			}
		})();
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
	collapse:function(){
		this.container.find('.question')
			.slideUp();
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
	responseMade:function(){
		var self = this;
		if(!this.answered){
			if(this.par.QUIZ_DATA.collapse_questions==true){
				this.collapse();
			}
			if(this.par.QUIZ_DATA.collapse_responders==true){
				this.responder.collapse();
			}
			if(this.par.QUIZ_DATA.auto_advance){
				this.par.advanceOne();
			}
			else{
				printBottom();	
			}
		}
		else{
			printBottom();
		}
		this.answered = true;
		this.container.addClass('answered');
		this.par.nav.updateArrows();
		function printBottom(){
			var bottom_wrapper = $('<div>')
				.addClass('choice_bottom')
				.appendTo(self.container);
			self
				.printLoader()
				.printFeedback(bottom_wrapper,function(){
					self.removeLoader();
					self
						.printNextBtn(bottom_wrapper);
					bottom_wrapper
						.imagesLoaded(function(){
							bottom_wrapper.slideDown();
						});
			});
		}
	}
};

function ChoiceGroup(par,choices){
	this.data = choices;
	this.par_slide = par;
	this.par_quiz = par.par;
	this.getConf();
	this.build();
}
ChoiceGroup.prototype = {
	build:function(){
		var self = this;
		this.container = $('<div>')
			.addClass('choices'+(self.conf.blocked_choices ? ' blocked':''))
			.appendTo(this.par_slide.container);
		this.getExcludedChoices();
		writeChoices();
		if(self.conf.blocked_choices){
			waitForWebfonts(['sl-ApresRegular'],function(){
				self.container.imagesLoaded(function(){
					equalizeChoiceHeights();
					if(self.complete){
						self.reflectChoice(self.selected_choice);
					}
				});
			});
		}
		else{
			if(this.complete){
				this.reflectChoice(this.selected_choice);
			}
		}
		return this;
		function writeChoices(){
			var choices_data = getChoicesToPrint();
			if(!self.choices){
				self.choices = [];
			}
			if(self.conf.randomize_choices){
				shuffleArray(choices_data);
			}
			choices_data.forEach(function(choice_data,i){
				if(self.choices[i]){
					self.choices[i].build();
				}
				else{
					printChoice(choice_data,i);
				}
			});
		}
		function equalizeChoiceHeights(){
			var max_height = 0;
			self.choices.forEach(function(choice){
				if(choice.container.height()>max_height){
					max_height = choice.container.height();
				}
			});
			self.choices.forEach(function(choice){
				choice.container.css('height',max_height);
			});
		}
		function uncenter(){
			// If all images are equal heights, vertical-align top on the choice cells
			if(allImagesEqualHeight()){
				self.choices.forEach(function(choice){
					choice.container.addClass('equal_height');
				});
			}
			function allImagesEqualHeight(){
				var height;
				for(var i=0;i<self.choices.length;i++){
					var choice = self.choices[i];
					if(choice.img){
						if(i===0){
							height = choice.img.height();
						}
						else{
							if(choice.img.height()!==height){
								return false;
							}
						}
					}
				}
				if(height===undefined){
					return false;
				}
				return true;
			}
		}
		function getChoicesToPrint(){
			if(self.data){
				if(typeof self.data === 'string' || typeof self.data === 'number'){
					return self.par_quiz.QUIZ_DATA.choices[self.data];
				}
				else{
					return self.data;
				}
			}
			else{
				return self.par_quiz.QUIZ_DATA.choices;
			}
		}
		function printChoice(choice_data,choice_index){
			self.choices.push(new Choice(choice_data,choice_index,self));
		}
	},
	collapse:function(){
		this.container.slideUp();
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
		if(choice.validity && choice.validity){
			this.par_quiz.user.score++;
		}
		this.selected_choice = choice;
		this.reflectChoice(this.selected_choice);
		if(this.par_quiz.QUIZ_DATA.collapse_choices){
			this.collapse();
		}
		this.complete = true;
	},
	collapse:function(){
		this.container
			.slideUp();
		this.container.find('.choice_bottom').css('border-top','none');
	},
	getConf:function(){
		this.conf = {};
		this.conf.blocked_choices = this.par_quiz.QUIZ_DATA.blocked_choices || false;
		this.conf.randomize_choices = this.par_quiz.QUIZ_DATA.randomize_choices || false;
		this.conf.exclusionary_choices = this.par_quiz.QUIZ_DATA.exclusionary_choices || false;
	},
	getExcludedChoices:function(){
		var self = this;
		if(!this.conf.exclusionary_choices || !this.par_quiz.QUIZ_DATA.choices){
			return;
		}
		var exclusions = [];
		var slides = this.par_quiz.slides;
		for(var i=0;i<slides.length;i++){
			if(slides[i]===self.par_slide){
				break;
			}
			exclusions.push(slides[i].data.correct);
		}
		if(exclusions.length > 0){
			this.exclusions = exclusions;
		}
		else{
			this.exclusions = false;
		}
		return this;
	},
	reflectChoice:function(choice){
		var self = this;
		choice = choice || this.selected_choice;
		this.validity = choice.validity;
		if(this.par_quiz.QUIZ_DATA.matcher){
			choice.markCorrect();
		}
		else{
			if(!choice.validity || !choice.validity){
					choice.markIncorrect();
				}
			this
				.markCorrectChoice();
		}
		this.par_slide.responseMade();
		if(!this.par_quiz.QUIZ_DATA.matcher){
			this.deactivateChoices();
		}
	},
	markCorrectChoice:function(){
		this.choices.forEach(function(choice){
			if(choice.validity){
				choice.markCorrect();
			}
		});
		return this;
	},
	deactivateChoices:function(){
		this.choices.forEach(function(choice){
			choice.container.unbind('click');
		});
		return this;
	}
};

function Choice(choice_data,choice_index,par){
	var self = this;
	this.par_choice_group = par;
	this.par_slide = par.par_slide;
	this.par_quiz = par.par_quiz;
	this.choice_index = choice_index;
	if(typeof choice_data == 'object'){
		this.data = choice_data;
	}
	else if(typeof choice_data == 'string'){
		this.data = {content:choice_data};
	}
	this.recordValidity();
	this.build();
}
Choice.prototype = {
	build:function(choice_index){
		var self = this;
		this.container = $('<div>')
			.data('choice_index',this.choice_index)
			.addClass('choice')
			.appendTo(this.par_choice_group.container);
		this.inner = $('<div>')
			.addClass('inner')
			.appendTo(this.container);
		this.content_wrapper = $('<div>')
			.addClass('content_wrapper')
			.appendTo(this.inner);
		if(this.par_choice_group.exclusions &&
			this.par_choice_group.exclusions.length > 0 &&
			this.par_choice_group.exclusions.indexOf(this.data.id)>-1){
				this.container.addClass('excluded');
		}
		else{
			this.container.click(function(e){
				if($(e.target).hasClass('btn_sound')){
					return;
				}
				self.par_choice_group.choiceClicked(self);
			});
		}
		if(this.data.img){
			this.printImg();
		}
		var content_string = this.data.content;
		if(content_string[0]==='*'){
			content_string = content_string.substring(1,content_string.length);
		}
		var content_wrapper = $('<p>')
			.addClass('choice_content')
			.html(content_string);
		if(this.data.sound){
			var sound_content_wrapper = $('<div>')
				.addClass('sound_content');
			this.printSound(sound_content_wrapper);
			content_wrapper.appendTo(sound_content_wrapper);
			sound_content_wrapper.appendTo(this.content_wrapper);
		}
		else{
			content_wrapper.appendTo(this.content_wrapper);
		}
		if(this.par_quiz.QUIZ_DATA.blocked_choices){
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
		this.img = $('<img>')
			.addClass('choice_img')
			.attr('src',INT_PATH+'quizzes/'+this.par_quiz.slug+'/img/'+src)
			.appendTo(this.content_wrapper);
		this.container.addClass('with_img');
	},
	printSound:function(target){
		var self = this;
		this.container.addClass('with_sound');
		var btn = this.par_quiz.appendSoundBtn(target,this.data.sound);
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
		if(this.par_slide.data.correct){
			var correct_choice_ids = this.par_slide.data.correct;
			if(typeof correct_choice_ids === 'string'){
				correct_choice_ids = [correct_choice_ids];
			}
			var validity = correct_choice_ids.indexOf(this.data.id)>-1;
			this.validity = validity.toString();
			return this;
		}
		if(this.data.content[0]==="*"){
			this.validity = true;
			return this;
		}
		this.validity = false;

		return this;
	}
};


function FillInTheBlank(par,correct){
	this.correct = correct;
	this.par_slide = par;
	this.par_quiz = par.par;
	this.reveals = 0;
	this.mistakes = [];
	this.entered_characters = [];
	this.max_mistakes = 3;
	this.build();
}
FillInTheBlank.prototype = {
	build:function(){
		var self = this;
		if(self.par_slide.answered){
			self.container.appendTo(self.par_slide.container);
			self.par_slide.responseMade();
			return;
		}
		(function printContainer(){
			self.container = $('<div>')
				.addClass('fill_in_the_blank')
				.appendTo(self.par_slide.container);
		})();
		(function printText(){
			var correct = self.correct;
			var words = correct.split(' ');
			self.text_wrapper = $('<div>')
				.addClass('text_wrapper')
				.appendTo(self.container);
			self.characters = [];
			words.forEach(function(word){
				var word_wrapper = $('<div>')
					.addClass('word')
					.appendTo(self.text_wrapper);
				for(var i=0;i<word.length;i++){
					var character = word[i];
					if([',','.','?','!',"'",' ','-'].indexOf(character)>-1){
						$('<div>')
							.addClass('character')
							.html(character)
							.appendTo(word_wrapper);
					}
					else{
						self.characters.push(new Character(character, word_wrapper));
					}
				}
			});
		})();
		(function printMistakesWrapper(){
			self.mistakes_wrapper = $('<div>')
				.addClass('mistakes')
				.appendTo(self.container);
			self.printed_mistakes = [];
			for(var i=0;i<self.max_mistakes;i++){
				self.printed_mistakes.push(new Mistake(self.mistakes_wrapper));
			}
			$('<div>')
				.addClass('mistakes_label')
				.html("Wrong guesses: ")
				.prependTo(self.mistakes_wrapper);
		})();
		(function printGhostTextInput(){
			//for mobile
			self.ghost_text_input = $('<input type="text">')
				.addClass('ghost_text_input')
				.prependTo(self.text_wrapper)
		})();
		this.addKeyListener();
	},
	addKeyListener:function(){
		var self = this;
		var slug = this.par_quiz.slug;
		$(window).bind('keyup.simple_quiz_'+slug,function(e){
			self.ghost_text_input.val('');
			var key = e.keyCode ? e.keyCode : e.which;
			if((key>=65&&key<=90)||(key>=48&&key<=57)){
				var character = String.fromCharCode(e.keyCode);
				self.characterEntered(character.toUpperCase());
			}
		});
	},
	removeKeyListener:function(){
		var slug = this.par_quiz.slug;
		$(window).unbind('keyup.simple_quiz_'+slug);
	},
	characterEntered:function(char){
		var self = this;
		var character_found = false;
		if(this.entered_characters.indexOf(char)>-1){
			this.characters.forEach(function(character){
				if(character.char===char){
					character.bounce();
				}
			});
		}
		this.characters.forEach(function(character){
			if(character.char === char){
				if(!character.revealed){
					character.reveal();
					self.reveals++;
				}
				character_found = true;
			}
		});
		if(!character_found){
			this.mistake(char);
		}
		this.checkCorrect();
		this.entered_characters.push(char);
	},
	checkCorrect:function(){
		if(this.reveals === this.characters.length){
			this.success();
		}
	},
	mistake:function(char){
		var self = this;
		var already_made = this.mistakes.indexOf(char)>-1;
		if(already_made){
			(function bounceMistake(){
				for(var i=self.printed_mistakes.length-1;i>=0;i--){
					if(self.printed_mistakes[i].char===char){
						self.printed_mistakes[i].bounce();
					}
				}
			}());
			return;
		}
		this.printMistake(char);
		this.mistakes.push(char);
		if(this.mistakes.length===this.max_mistakes){
			this.failure();
		}
	},
	printMistake:function(char){
		var printed_mistakes = this.printed_mistakes;
		for(var i=printed_mistakes.length-1;i>=0;i--){
			if(!this.printed_mistakes[i].filled){
				this.printed_mistakes[i].fill(char);
				break;
			}
		}
	},
	complete:function(){
		this.par_slide.responseMade();
		this.removeKeyListener();
		this.ghost_text_input.remove();
		this.par_slide.answered = true;
	},
	success:function(){
		this.par_slide.validity = true;
		this.par_quiz.user.score++;
		this.complete();
	},
	failure:function(){
		this.par_slide.validity = false;
		this.characters.forEach(function(character){
			if(!character.revealed){
				character.reveal(true);
			}
		})
		this.complete();
	},
	collapse:function(){
		this.container.slideUp();
	}
};
function Character(char,target){
	this.char = char.toUpperCase();
	this.container = $('<div>')
		.addClass('character')
		.appendTo(target);
}
Character.prototype = {
	reveal:function(wrong){
		this.container.html(this.char);
		this.revealed = true;
		if(wrong){
			this.container.addClass('wrong');
		}
	},
	bounce:function(){
		var self = this;
		this.container
			.addClass('used')
		setTimeout(function(){
			self.container.removeClass('used');
		},300);
	}
}
function Mistake(target){
	this.filled = false;
	this.container = $('<div>')
		.addClass('mistake unfilled')
		.html('&#160;')
		.prependTo(target);
}
Mistake.prototype = {
	fill:function(char){
		this.char = char;
		this.container
			.html(char)
		this.filled = true;
	},
	bounce:function(){
		var self = this;
		this.container
			.addClass('used')
		setTimeout(function(){
			self.container.removeClass('used');
		},300);
	}
}



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
		this.printSound();
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
		if(this.par.validity){
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
				if(img_data.position === 'bottom'){
					wrapper.appendTo(self.container);
				}
				else{
					wrapper.prependTo(self.container);
				}
			}
			else{
				wrapper.prependTo(self.container);
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
	},
	printSound:function(){
		if(this.data.sound){
			this.container.addClass('with_sound');
			this.par.par.appendSoundBtn(this.container, this.data.sound);
		}
	}
};

function YouTube(video_id,target){
	var container = $('<iframe allowfullscreen>')
		.attr('src','//www.youtube.com/embed/'+video_id)
		.attr('frameborder',0)
		.appendTo(target)
	container
		.css('height',parseInt((315*container.width())/560,10));
	return container;
}

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
