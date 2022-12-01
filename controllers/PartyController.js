const { v4: uuidv4 } = require('uuid');
const randomstring = require("randomstring");
const Game = require('../assets/js/game');
class PartyController {

    async party(req, res) {
        var params = req.query;
        var username = decodeURI(req.query.username);
        let game = await this.getPartyList(params.code);
        if(game == undefined || username == undefined || username == "") 
            res.redirect('/')
        else {
            res.render('game', {
                code: params.code,
                username: username,
                roomID:  game.roomID
            })
        }
    }

    async createParty(req, res, server) {
        var post = req.body;
        var username = post.username;
        var codeParty = randomstring.generate(7);
        var roomID = randomstring.generate(16);
        global.partyList.push(new Game({code: codeParty, roomID: roomID, server: server}))
        res.redirect('/game?code='+codeParty+"&username="+encodeURI(username))
    }

    async joinParty(req, res) {
        var post = req.body;
        var username = post.username;
        var partyCode = post.partyCode;
        let game = await this.getPartyList(partyCode);
        if(game == undefined || username == undefined || username == "") res.redirect('/')
        else res.redirect('/game?code='+game.code+'&roomID='+game.roomID+"&username="+encodeURI(username))
    }

    async getPartyList(code){
        let game;
        for await (const party of global.partyList){
            if(party.code === code){
                game = party;
                break;
            }
        }
        return game;
    }


}

module.exports = PartyController;