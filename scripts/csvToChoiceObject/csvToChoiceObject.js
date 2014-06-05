var tsv = require("node-tsv-json");
  tsv({
    input: "data.tsv",
    output: "data.json",
    //array of arrays, 1st array is column names
    parseRows: falsez
  }, function(err, result) {
    if(err) {
      console.error(err);
    }else {
      cleanup(result);
    }
  });



function cleanup(json){
var out = [];

json.forEach(function(row){
  var q = {};
  q.content = row.question;
  q.choices = [];
  for(var i in row){
    if(row.hasOwnProperty(i)){
      if(i.indexOf('choice')>-1){
        q.choices.push({
          "content":row[i],
          "validity":"false"
        });
      }
    }
  }
  var correct = row.correct.split(',');
  correct.forEach(function(correct_index){
    q.choices[correct_index-1].validity = "true";
  });
  q.feedback = row.feedback;
  out.push(q);
});
console.log(JSON.stringify(out));


}
