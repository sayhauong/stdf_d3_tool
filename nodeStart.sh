#!/bin/bash
# set the STRING variable
STRING="Hello World!"
# print the contents of the variable on screen
echo $STRING
node app.js &
start http://localhost:3000/drop