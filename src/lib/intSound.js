/*

Download SoundJS: http://www.createjs.com/#!/SoundJS

Embed SoundJS in HTML:
<!--sound js-->
<script type="text/javascript" src="soundjs/soundjs-0.5.2.min.js"></script>
<script type="text/javascript" src="soundjs/flashplugin-0.5.2.min.js"></script>

*/
define(function(){
  var module = {
    loaded_sounds:{},
    // Run IntSound.initialize() at the beginning of your interactive
    initialize:function(directory){
      if(!module.initialized){
        createjs.FlashPlugin.swfPath = directory+'/';
        createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashPlugin]);
        createjs.Sound.alternateExtensions = ["ogg"];
        module.initialized = true;
      }
    },
    // Takes a jQuery obj (btn) and attaches an event listener to it. When clicked, the button plays sound_id,
    // which is the name of the file of the desired sound without its extension, and gets a class called
    // "playing_sound," which is removed when the sound ends or the user clicks the button a second time. Use this class
    // in CSS to change the appearance of the button. For example, the button might initially look like a play button,
    // and .playing_sound may give it the appearance of a stop button.
    // Example: IntSound.tieToButton($('.my_button'),'mysound');
    tieToButton:function(btn,sound_directory,sound_id){
      btn.click(function(){
        if(!btn.hasClass('playing_sound')){
          if(module.loaded_sounds[sound_id]===undefined){
            loadSound();
          }
          else{
            playit();
          }
        }
        else{
          stopSound();
        }
        function loadSound(){
          var sound_path = sound_directory+sound_id+'.mp3';
          btn.addClass('loading');
          createjs.Sound.addEventListener("fileload",soundLoaded);
          createjs.Sound.registerSound(sound_path,sound_id);
        }
        function soundLoaded(){
          module.loaded_sounds[sound_id] = true;
          playit();
          createjs.Sound.removeEventListener("fileload",soundLoaded);
        }
        function playit(){
          stopSound();
          btn.removeClass('loading');
          btn.addClass('playing_sound');
          instance = createjs.Sound.play(sound_id);
          instance.addEventListener("complete",endSound);
        }
        function stopSound(){
          $('.playing_sound').removeClass('playing_sound');
          createjs.Sound.stop();
          endSound();
        }
        function endSound(){
          btn.removeClass('playing_sound');
          btn.removeClass('playing_sound');
        }
      });
    },
    // Int.stopAll() stops all sounds from playing, and removes the .playing_sound class from all buttons.
    stopAll:function(){
      createjs.Sound.stop();
      $('.playing_sound').removeClass('playing_sound');
    }
  };
  return module;
});
