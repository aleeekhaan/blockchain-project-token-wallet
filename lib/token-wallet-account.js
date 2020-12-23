
class WalletAccount {

    constructor (clientId, email, fname, lname, pass) {
        this.clientId = clientId;
        this.email = email;
        this.fname = fname;
        this.lname = lname;
        this.pass = pass;
    }
}

module.exports = WalletAccount;