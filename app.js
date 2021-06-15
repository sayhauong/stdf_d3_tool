const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const fs = require("fs");
const stdf = require("stdfjs");
const multer = require('multer');
const { Parser } = require('json2csv');
const formidableMiddleware = require('express-formidable');

var cors = require("cors");
const app = express();
app.use(cors());

// app.use(express.static("public"));
// const upload = multer({
//   dest: 'uploads/'
// });

app.use(formidableMiddleware({
  encoding: 'utf-8',
  uploadDir: 'uploads/',
  multiples: true, // req.files to be arrays of files
}));


const homeStartingContent = "This is a tool to read and analyze stdf";
const contactContent = "Made by SayHau Ong";

const path = __dirname + "\\data\\"+ "test.json";
console.log(path);
var jsonSample = require(path);


var rawRecsJson = [];
var processedRecsJson = [];
var keysRec = [];

var limJson = {};
var prrsRec = [];
var csvRec = [];

// prrsRec = jsonSample;


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({
  extended: true
}));

app.use(express.static("public"));

// let posts = [];


app.get("/", function(req, res) {
  res.render("home", {
    startingContent: homeStartingContent,
    // posts: posts
  });

  console.log(jsonSample.length);
});

app.get("/about", function(req, res) {
  res.render("about", {
    aboutContent: aboutContent
  });
});

app.get("/contact", function(req, res) {
  res.render("contact", {
    contactContent: contactContent
  });
});

app.get("/filepond", function(req, res) {
  res.render("filepond");
});

app.delete("/filepond", function(req, res) {
     console.log("entering delete");
   console.log(req.fields.id);
   var path = req.fields.id;
   path = path.replace(/\\\\/g, "\\");
    path = path.replace(/"/g, "");
   // path = path.replace("uploads\\\\", "");
   console.log(__dirname + "\\"+  path);
   const fs = require('fs')
   try {
  fs.unlinkSync( __dirname + "\\"+  path)
  //file removed
} catch(err) {
  console.error(err)
}
});

app.post("/filepond", function(req, res, next) {
  console.log("filepond post request received");

  // res.send('serverokay');

  let rs = fs.createReadStream(req.files.filepond.path);
  let parser = stdf
    .parser()
    .on('rec', r => {
      var buff = ('%j', r)
      rawRecsJson.push(buff);
    })
    .on('part', p => {
      var buff = ('%j', p)
      rawRecsJson.push(buff);
    })

  rs.on('data', ck => {
    parser.push(ck)
  }).on('end', () => {

// processedRecsJson = {...rawRecsJson};
rawRecsJson.forEach(function(rawRecJson){
  var tmpJson = {};
  Object.keys(rawRecJson).forEach(k=>{
    tmpJson[k.replace(/\W+/g, ' ').replace(/\s+/g,":")]= rawRecJson[k];

  })

      processedRecsJson.push(tmpJson);
  // console.log(rawRecJson);
  // (rawRecJson.REC_TYP === "PTR" &&  rawRecJson.TEST_TXT )? tmpJson["TEST_TXT"]=rawRecJson['TEST_TXT'].replace(/\ +|\W+/g, ' ').replace(/\ /g,":"): null;
  if (rawRecJson.REC_TYP === "PTR") {
    if(rawRecJson.hasOwnProperty("LO_LIMIT"))
    {
      var testname = rawRecJson.TEST_TXT.replace(/\W+/g, ' ').replace(/\s+/g,":");
        tmpJson["TEST_TXT"] =testname ;
    }
  }

})

// console.log(processedRecsJson);

              let prevRec;
              csvRec = [{},{},{}] ; // testnum: loLim: hiLim

              processedRecsJson.forEach(function(recJson) {
                // console.log(recJson);
                  if (recJson.REC_TYP === "PTR") {
                    if(recJson.hasOwnProperty("LO_LIMIT"))
                    {
                      var testname = recJson.TEST_TXT;
                      limJson[testname] ={...recJson} ;
                    }
                  }
              });

              // console.log(prrsRec);
              var buffPartialPrr ;
              var buffNoLimInfo  ;

              processedRecsJson.forEach(function(recJson) {
                if (prevRec === "PRR") {
                  csvRec.push( {...buffPartialPrr, ... recJson});
                    prrsRec.push( {...buffPartialPrr, ... recJson});
                   // console.log({...recJson});
                  prevRec = "";
                }
                if (recJson.REC_TYP) {
                  (recJson.REC_TYP ==='PRR') ? buffPartialPrr={...recJson}: buffPartialPrr={};
                  (recJson.REC_TYP ==='PRR') ? buffNoLimInfo={...recJson}: null;
                    // (recJson.REC_TYP ==='PRR')? console.log(recJson):null;
                  prevRec = recJson.REC_TYP;
                }
              });

    parser.push()
      //to generate csv
          const json2csvParser = new Parser();

          const indexOfFirst = req.files.filepond.name.indexOf(".");
          const newFileName = req.files.filepond.name.substr(0,indexOfFirst);


          // prrsRec['limit']={};
          for(var key of Object.keys(buffNoLimInfo) ){
           csvRec[0][key] = 0;
           csvRec[1][key] = 0;
           csvRec[2][key] = 0;
           // prrsRec[0][key]= {'tnum':0, 'loLim':0, 'hiLim':0}
          }
          for(var key of Object.keys(limJson) ){
           csvRec[0][key] = limJson[key].TEST_NUM;
           csvRec[1][key] = limJson[key].LO_LIMIT;
           csvRec[2][key] = limJson[key].HI_LIMIT;
           // prrsRec[0][key]= {'tnum':limJson[key].TEST_NUM, 'loLim':limJson[key].LO_LIMIT, 'hiLim':limJson[key].HI_LIMIT}
          }

          // console.log(csvRec);
          const csv = json2csvParser.parse(prrsRec);

var jsonPlotData={};
jsonPlotData["data"]= [...prrsRec];
jsonPlotData["limit"]= {...limJson};

          var jsonData = JSON.stringify(jsonPlotData);
          // console.log(jsonData);
          fs.writeFile(__dirname + "\\data\\"+ newFileName  + ".json", jsonData, function(err) {
            if (err) throw err;
          });



          fs.writeFile(__dirname + "\\data\\"+ newFileName  + ".csv", csv, function(err) {
            if (err) throw err;
             // res.send( {'id': req.files.filepond.path});
              res.send(JSON.stringify( req.files.filepond.path));
          });

  }) // end of reading STDF record

console.log('done: ' + req.files.filepond.path);
});


app.get("/drop", function(req, res) {
  res.render("drop");
});


app.get("/post", function(req, res){

  keysRec=(Object.keys(limJson));
  console.log(keysRec);
  res.render("post", {
    title: "",
    content: "",
    testRecords : keysRec
  } );

  // posts.forEach(function(post){
  //   const storedTitle = _.lowerCase(post.title);
  //
  //   if (storedTitle === requestedTitle) {
  //     res.render("post", {
  //       title: post.title,
  //       content: post.content
  //     });
  //   }
  // });

});

app.get("/bxplot", function(req, res){
  // const requestedTitle = _.lowerCase(req.params.postName);

    // keysRec=(Object.keys(prrsRec[0]));
    keysRec="";
// console.log(keysRec.length);
  res.render("bxplot", {
    title: "",
    content: "",
    testRecords : keysRec
  } );

});

app.get("/histplot", function(req, res){
  // const requestedTitle = _.lowerCase(req.params.postName);

    // keysRec=(Object.keys(prrsRec[0]));
    keysRec="";
console.log(keysRec.length);
  res.render("histplot", {
    title: "",
    content: "",
    testRecords : keysRec
  } );


});

app.get("/cdfplot", function(req, res){
  // const requestedTitle = _.lowerCase(req.params.postName);

    // keysRec=(Object.keys(prrsRec[0]));
    keysRec="";
// console.log(keysRec.length);
  res.render("cdfplot", {
    title: "",
    content: "",
    testRecords : keysRec
  } );

});

app.listen(3030, function() {
  console.log("Server started on port 3030");
});
