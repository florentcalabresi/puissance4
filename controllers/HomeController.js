const randomstring = require("randomstring");
class PartyController {

    async index(req, res) {
        res.render('index', {session: req.cookies?.discord_datas, salt_sid: randomstring.generate(6)})
    }

}

module.exports = PartyController;