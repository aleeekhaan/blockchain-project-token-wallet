var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
const networkUtils = require('../utils/networkUtil');

module.exports = async function (passport) {
    try {
        const wallet = await networkUtils.getWallet("Org1");
        const adminId = await wallet.get('org1Admin');
        const adminCert = adminId.credentials.certificate;
        let opts = {};
        opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
        opts.secretOrKey = adminCert;
        passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
            try {
                console.log(jwt_payload);
                const email = jwt_payload.walletAcc.email;
                const userExists = await wallet.get(email);
                if(userExists) {
                    return done(null, user);
                }
                else {
                    return done(null, false);
                }
            }
            catch (e) {
                return done(null, false);
            }
        }));
    }   
    catch (e) {
        return (e, false);      
    } 
};