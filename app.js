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


const homeStartingContent = "This is an example tool to read and analyze stdf. I started this Nodejs project to read stdf with stdfjs and visualize the data by d3. I used the histogram template by Charles Allen and ported everything to D3V6. The tool can take STDF and parse it into JSON record, however, i have limited the data to an example JSON for now, as this is a free server."
const secondaryContent = "There are some touching up to be done, along with many more possible exciting features (e.g: X vs Y plot, wafer map, data binding, RnR, dynamic CPK analaysis etc) but Unfortunately i have to stop at this point as this is quite resource extensive and i am moving to next project. If you see the potential and interested to industrialize it please don't hesitate to contact me.";
const contactContent = "For more possibilities or inquiries please contact : ";

// const path = __dirname + "\\data\\"+ "test.json";
// console.log(path);
// var jsonSample = require(path);
 const jsonDataPath = __dirname + "\\public\\data\\";

var rawRecsJson = [];
var processedRecsJson = [];
let keysRec = "";

var limJson = {};
var prrsRec = [];
var csvRec = [];
var jsonData;
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
    secondaryContent: secondaryContent
  });

  // console.log(jsonSample.length);
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

rawRecsJson.forEach(function(rawRecJson){
  var tmpJson = {};
  Object.keys(rawRecJson).forEach(k=>{
    tmpJson[k.replace(/\W+/g, ' ').replace(/\s+/g,":")]= rawRecJson[k];

  })

      processedRecsJson.push(tmpJson);

  if (rawRecJson.REC_TYP === "PTR") {
    if(rawRecJson.hasOwnProperty("LO_LIMIT"))
    {
      var testname = rawRecJson.TEST_TXT.replace(/\W+/g, ' ').replace(/\s+/g,":");
        tmpJson["TEST_TXT"] =testname ;
    }
  }

})
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

              var buffPartialPrr ;
              var buffNoLimInfo  ;

              processedRecsJson.forEach(function(recJson) {
                if (prevRec === "PRR") {
                  csvRec.push( {...buffPartialPrr, ... recJson});
                    prrsRec.push( {...buffPartialPrr, ... recJson});
                  prevRec = "";
                }
                if (recJson.REC_TYP) {
                  (recJson.REC_TYP ==='PRR') ? buffPartialPrr={...recJson}: buffPartialPrr={};
                  (recJson.REC_TYP ==='PRR') ? buffNoLimInfo={...recJson}: null;
                  prevRec = recJson.REC_TYP;
                }
              });
    parser.push()
      //to generate csv
          const json2csvParser = new Parser();

          const indexOfFirst = req.files.filepond.name.indexOf(".");
          const newFileName = req.files.filepond.name.substr(0,indexOfFirst);

          for(var key of Object.keys(buffNoLimInfo) ){
           csvRec[0][key] = 0;
           csvRec[1][key] = 0;
           csvRec[2][key] = 0;
          }
          for(var key of Object.keys(limJson) ){
           csvRec[0][key] = limJson[key].TEST_NUM;
           csvRec[1][key] = limJson[key].LO_LIMIT;
           csvRec[2][key] = limJson[key].HI_LIMIT;
          }

          const csv = json2csvParser.parse(prrsRec);

var jsonPlotData={};
jsonPlotData["data"]= [...prrsRec];
jsonPlotData["limit"]= {...limJson};

          jsonData = JSON.stringify(jsonPlotData);
          // console.log(jsonData);
          fs.writeFile(__dirname + "\\data\\"+ newFileName  + ".json", jsonData, function(err) {
            if (err) throw err;
          });

          fs.writeFile(__dirname + "\\data\\"+ newFileName  + ".csv", csv, function(err) {
            if (err) throw err;
          });

  }) // end of reading STDF record


//remove uploaded file once processing is done
  try {
 fs.unlinkSync( __dirname + "\\"+  req.files.filepond.path)
   console.log("removed: " + __dirname + "\\"+  req.files.filepond.path);
 //file removed
} catch(err) {
 console.error(err)
}

console.log('done: ' + req.files.filepond.path);

res.redirect("/");
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

let jsonDataFiles ;
app.get("/bxplot", function(req, res){

  // fs.readdir(jsonDataPath, (err,files)=>{
  //   files.forEach(file=>{
  //     if (file.indexOf(".json") !== -1 ){
  //       jsonDataFiles.push(file);
  //       console.log(jsonDataFiles);}
  //   });
  // });


keysRec = "sample_data.json";
  res.render("bxplot", {
    title: "",
    content :"",
    testRecordArray: jsonDataFiles,
    testRecords : keysRec
  } );

jsonDataFiles = [];

});

app.post("/bxplot", function(req, res){

console.log("post triggered");
keysRec = "sample_data.json";

res.redirect("/bxplot")

});

app.get("/histplot", function(req, res){
keysRec = "sample_data.json";
console.log(keysRec.length);
  res.render("histplot", {
    title: "",
    content: "",
    testRecords : keysRec
  } );


});

app.get("/cdfplot", function(req, res){
  keysRec = "sample_data.json";
  res.render("cdfplot", {
    title: "",
    content: "",
    testRecords : keysRec
  } );

});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
