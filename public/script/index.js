// const fs = require('fs');


let $target = undefined;

$(document).ready(function(){
  $("span").on("dragstart", dragStartEventHandler);
  $("body")
  .on("dragover", event =>{console.log("draggedover"); event.preventDefault();})
  .on("drop", dropEventHandler);
});

function dragStartEventHandler(event){
  $target = $(this);
  (event.originalEvent || event ).dataTransfer.setData("text","");
  $(this).css("cursor","grab");
  console.log("dragstart");
}

function dropEventHandler(ev){
  // $target.css({left: event.clientX, top: event.clientY, cursor:"default"});
  console.log("drop enter");
  let dt = ev.dataTransfer
    let files = dt.files


  // let rs
  // rs = fs.createReadStream(ev)
  console.log("drop exit");

  // if (ev.dataTransfer.items) {
  //   // Use DataTransferItemList interface to access the file(s)
  //   for (var i = 0; i < ev.dataTransfer.items.length; i++) {
  //     // If dropped items aren't files, reject them
  //     if (ev.dataTransfer.items[i].kind === 'file') {
  //       var file = ev.dataTransfer.items[i].getAsFile();
  //       console.log('... file[' + i + '].name = ' + file.name);
  //     }
  //   }
  // } else {
  //   // Use DataTransfer interface to access the file(s)
  //   for (var i = 0; i < ev.dataTransfer.files.length; i++) {
  //     console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
  //   }
  // }
}
