var MAX_WIDTH = 521;
var MAX_HEIGHT = 292;
var gm = require('gm');
var fs = require('fs');
var minimatch = require('minimatch');
//var writeStream = fs.createWriteStream('output.jpg',{flags:'w'});

var quiz_id = process.argv[2];
if(!quiz_id){
  console.log('no quiz_id found');
  process.exit();
}

var image_directory = '../../art/quizzes/'+quiz_id+'/';
var files =  fs.readdirSync(image_directory);
files.forEach(function(file_name){
  if(minimatch(file_name,'*.+(jpg|png|jpeg|gif)')){
    var image_path = image_directory + file_name;
    var img = gm(image_path)
    processImg(img,file_name);
  }
});

function processImg(img,file_name){
  console.log('processing: '+file_name);
  img.format(function(format){
    if(format==='GIF'){
      writeImg(img,file_name);
      return;
    }
    constrain(img,MAX_WIDTH,MAX_HEIGHT,function(){
      writeTmpImg(img,file_name,function(tmp_img){
        getSmallerImg(file_name,img,tmp_img,function(img){
          writeImg(img,file_name);
        });
      });
    });
  });

}
function constrain(img,max_w,max_h,callback){
  console.log('resizing');
  img.resize(MAX_WIDTH,MAX_HEIGHT);
  callback();
}
function writeTmpImg(img,file_name,callback){
  var tmp_path = 'tmp/'+file_name;
  img.write(tmp_path,function(err){
    callback(gm(tmp_path));
  })
}
function getSmallerImg(file_name,img_a,img_b,callback){
  img_a.filesize(function(err,size_a){
    img_b.filesize(function(err,size_b){
      size_a = parseInt(size_a.replace('K',''));
      size_b = parseInt(size_b.replace('K',''));
      console.log(file_name,size_a,size_b);
      if(size_a<size_b){
        console.log('return a');
        callback(img_a);
      }
      else{
        console.log('return b');
        callback(img_b);
      }
    });
  });
}
function writeImg(img,file_name){
  var target_path = '../../src/quizzes/'+quiz_id+'/img/'+file_name;
  img
    .write(target_path,function(err){
      console.log(file_name+' written');
    });
}
