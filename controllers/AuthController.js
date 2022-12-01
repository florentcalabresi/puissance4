const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto')
const DiscordOauth2 = require("discord-oauth2");
const { type } = require('os');
class AuthController {

    constructor(){
        this.optsdiscauth = {
            clientId: "1031869486267125781",
            clientSecret: "tzjYJ489DkLmdjlR0x_jwkdXH0bQ_nOj",
            redirectUri: "http://92.140.68.74:3000/auth/callback",
        }
        this.oauth = new DiscordOauth2(this.optsdiscauth);
    }

    async start(req, res) {
        var cookie = req.cookies?.discord_session;
        if (cookie === 'undefined' || cookie === undefined ) {
            const url = this.oauth.generateAuthUrl({
                scope: ["identify"],
                state: crypto.randomBytes(16).toString("hex"), // Be aware that randomBytes is sync if no callback is provided
            });
            res.redirect(url)
        }else{
            this.oauth.getUser(cookie.atoken).then((result) => {
                res.cookie('discord_datas', {user: result}, { expires: new Date(Date.now() + 7 * 24 * 3600 * 1000), maxAge: 5 * 60 * 1000, httpOnly: true });
                res.redirect('/')
            });
        }
    }

    async callback(req, res) {
        const params = req.query;
        this.optsdiscauth['code'] = params.code;
        this.optsdiscauth['scope'] = "identify guilds";
        this.optsdiscauth['grantType'] = "authorization_code";

        this.oauth.tokenRequest(this.optsdiscauth).then((result) => {
            res.cookie('discord_session', {atoken: result.access_token, rtoken: result.refresh_token}, { expires: new Date(Date.now() + 7 * 24 * 3600 * 1000), maxAge: 5 * 60 * 1000, httpOnly: true });
            this.oauth.getUser(result.access_token).then((result) => {
                res.cookie('discord_datas', {user: result}, { expires: new Date(Date.now() + 7 * 24 * 3600 * 1000), maxAge: 5 * 60 * 1000, httpOnly: true });
                res.redirect('/')
            });
        }).catch((err) => {
            res.redirect('/auth/start')
        })
    }

}

module.exports = AuthController;