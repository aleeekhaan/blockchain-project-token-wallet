const router =  require ("express").Router();
const passport = require('passport');
const networkUtils = require('../utils/networkUtil');
const authUtil = require('../utils/authUtil');

const adminEmail = "admin@org1.com"

router.post('/deposit', async (req, res) => {
    try {
        const { email, amount } = req.body
        console.log(req.body)
        const contract = await networkUtils.connectToFabric("org1Admin");
        let mint = await contract.submitTransaction("Mint", amount);
        if (mint) {
            let trans = await contract.submitTransaction("Transfer", email, amount)
            
            if (trans) {
                let newBal = await contract.submitTransaction("BalanceOf", email)
                res.json({"success" : true, "updatedBalance" : parseInt(newBal)});
            }
        }
    }
    catch (e) {
        console.error(e);
        res.json({success : false, err : e});
    }
})

router.post('/withdraw', async (req, res) => {
    try {
        const { email, amount } = req.body
        const contract = await networkUtils.connectToFabric(email);
        let trans = await contract.submitTransaction("Transfer", adminEmail, amount)
        if (trans) {
            let contract1 = await networkUtils.connectToFabric("org1Admin");
            let burn = await contract1.submitTransaction("Burn", amount)
            
            if (burn) {
                let newBal = await contract.submitTransaction("BalanceOf", email)
                res.json({"success" : true, "updatedBalance" : parseInt(newBal)});
            }
        }
    }
    catch (e) {
        console.error(e);
        res.json({success : false, err : e});
    }
})

router.post('/transfer', async (req, res)=>{
    try {
        const {to, from, amount} = req.body;
        const contract = await networkUtils.connectToFabric(from);
        const trans = await contract.submitTransaction("Transfer", to, amount);
        if (trans) {
            let newBal = await contract.submitTransaction("ClientAccountBalance")
            res.json({"success" : true, "updatedBalance_sender" : parseInt(newBal)});
        }
    }
    catch (e) {
        console.error(e);
        res.json({success : false, err : e});
    }
})

router.post('/accountBalance', async (req, res)=>{
    const { email } = req.body;
    try {
        const contract = await networkUtils.connectToFabric(email);
        const bal = await contract.submitTransaction("BalanceOf", email);
        res.json({success : true, balance : parseInt(bal)})
    }
    catch (e) {
        console.error(e);
        res.json({success : false, err : e});
    }
})

router.post('/history', async (req, res) => {
    let email = req.body.email;
    try {
        let contract = await networkUtils.connectToFabric(email);
        let history = await contract.submitTransaction("getTransactionHistory");
        res.json({success : true, txHistory : history.toString()})
    }
    catch (e) {
        console.error(e);
        res.json({success : false, err : e});
    }
})

module.exports = router;