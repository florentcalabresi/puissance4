const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const http = require('http');
const server = http.createServer(app);
const Game = require('./assets/js/game');
const Route = require('./route');
const bodyParser = require('body-parser');
global.partyList = [];
let sockets = [];
let ejs = require('ejs');

setInterval(() => {
  //console.log(global.partyList.length)
}, 2500)

app.use(express.static('assets'))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

new Route(app, server);

const getGame = async(id) => {
  for await(const party of partyCurrent) {
    if(id == party.idgame) return party;
  }
}

server.listen(3000, () => {
  console.log('listening on *:3000');
});