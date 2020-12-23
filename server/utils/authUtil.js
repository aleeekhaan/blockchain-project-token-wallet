const jwt = require('jsonwebtoken');
const networkUtils = require('./networkUtil');


module.exports.extractAuthToken = async (req, res, next) => {
    try {
        const wallet = await networkUtils.getWallet("Org1");
        const adminId = await wallet.get('org1Admin');
        const adminCert = 'id.credentials.certificate';

        const bearerHeader = req.headers['authorization'];
        if (typeof bearerHeader !== undefined) {
            const bearer = bearerHeader.split(" ");
            const bearerToken = bearer[1];
            jwt.verify(bearerToken, adminCert, (err, payload) => {
                if(err) {
                    throw (err);
                }
                else {
                    console.log(payload)
                    req.payload = payload;
                    next();
                }
            })

        }
        else {
            res.sendStatus(403);
        }
    }
    catch (e) {
        console.error(e);
        res.sendStatus(403);
    }
}