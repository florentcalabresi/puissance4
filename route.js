const HomeController = require('./controllers/HomeController');
const PartyController = require('./controllers/PartyController');
const AuthController = require('./controllers/AuthController');
const homeController = new HomeController();
const partyController = new PartyController();
const authController = new AuthController();

const env = require('./env.json')

class Route {

    constructor(app, server){
        app.get('/', async (req, res) => {
            homeController.index(req, res)
        });
          
        app.get('/game', (req, res) => {
            partyController.party(req, res, server)
        });

        app.post('/game/create', function (req, res) {
            partyController.createParty(req, res, server)
        });

        app.post('/game/join', (req, res) => {
            partyController.joinParty(req, res, server)
        });

        app.get('/game/game_index', async(req, res) => {
            //if(!(await this.middleWareRequestServer(req))) return res.status(401).send('Not authorized')
            res.render('plateau', {
                
            })
        });

        app.get('/game/plateau', async(req, res) => {
            //if(!(await this.middleWareRequestServer(req))) return res.status(401).send('Not authorized')
            res.render('plateau', {
                
            })
        });

        app.get('/auth/start', (req, res) => {
            authController.start(req, res)
        });

        app.get('/auth/callback', (req, res) => {
            authController.callback(req, res)
        });
    }

    async getIpFromRequest(req) {
        let ips = (
            req.headers['cf-connecting-ip'] ||
            req.headers['x-real-ip'] ||
            req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress || ''
        ).split(',');
    
        return ips[0].trim();
    };

    async middleWareRequestServer(req){
        let result;
        await this.getIpFromRequest(req).then((ip) => {
            result = ip.replaceAll('::ffff:', '') == env.IP_APP;
        })
        return result;
    }

}

module.exports = Route;