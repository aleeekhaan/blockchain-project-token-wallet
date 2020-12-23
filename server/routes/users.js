const router =  require ("express").Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const networkUtils = require('../utils/networkUtil');

router.post('/register', async (req, res)=> {
    const {email, fname, lname, password } = req.body;
    reg = await networkUtils.registerIdentity(email, fname, lname, password);
    res.send(reg)
})

router.post('/authenticate', async (req, res) => {
    const {email, password} = req.body;
    try {
        const contract = await networkUtils.connectToFabric(email);
        const walletAccBytes = await contract.submitTransaction("getWalletAccount");
        const walletAcc = JSON.parse(walletAccBytes.toString());
        const pass = walletAcc.pass;
        const comparison = await bcrypt.compare(password, pass);

        if(comparison) {
            const wallet = await networkUtils.getWallet("Org1");
            const id = await wallet.get("org1Admin");
            const adminCert = id.credentials.certificate;
            const token = jwt.sign({walletAcc}, adminCert,{ expiresIn : 604800 });

            const clientWallet = {
                "success" : true,
                "token" : "JWT "+token,
                "clientWalletAccount" : {
                    "clientId" : walletAcc.clientId,
                    "email" : walletAcc.email,
                    "fname" : walletAcc.fname,
                    "lname" : walletAcc.lname,
                }
            }

            res.send(clientWallet);
        }
        else {
            throw new Error("Incorrect password.")
        }
    }
    catch (e) {
        console.error(e);
        res.json({success : false, err : e});
    }
});

module.exports = router;