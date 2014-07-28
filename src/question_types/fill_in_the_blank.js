define(function(){
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
            if(isLetterOrNumber(character)){
              self.characters.push(new Character(character, word_wrapper));
            }
            else{
              $('<div>')
                .addClass('character')
                .html(character)
                .appendTo(word_wrapper);
            }
          }
        });
        function isLetterOrNumber(character){
          var char_code = character.charCodeAt(0);
          if(char_code>=65&&char_code<=90){
            return true; //is uppercase character
          }
          if(char_code>=97&&char_code<=122){
            return true; //is lowercase character
          }
          if(char_code>=48&&char_code<=57){
            return true;
          }
          return false;
        }
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
      (function printSkipBtn(){
        $('<div>')
          .addClass('btn_skip')
          .html('Give Up')
          .appendTo(self.mistakes_wrapper)
          .click(function(){
            self.giveUp();
          });
      }());
      (function printGhostTextInput(){
        //for mobile
        self.ghost_text_input = $('<input type="text">')
          .addClass('ghost_text_input')
          .prependTo(self.text_wrapper);
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
      });
      this.complete();
    },
    collapse:function(){
      this.container.slideUp();
    },
    giveUp:function(){
      this.failure();
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
        .addClass('used');
      setTimeout(function(){
        self.container.removeClass('used');
      },300);
    }
  };
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
        .html(char);
      this.filled = true;
    },
    bounce:function(){
      var self = this;
      this.container
        .addClass('used');
      setTimeout(function(){
        self.container.removeClass('used');
      },300);
    }
  };
  return FillInTheBlank;
});
