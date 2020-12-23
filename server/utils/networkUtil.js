const { Gateway, Wallet, Wallets, IdentityService } = require('fabric-network');
const WalletMigration = require('fabric-wallet-migration')
const path = require('path')
const FabricCAServices = require('fabric-ca-client');
const bcrypt = require('bcryptjs');
const ConnectionProfile = require('../../connectionProfile.json');

module.exports.createX509Identity = createX509Identity = (enrollment, mspId) => {
    x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: mspId,
        type: 'X.509',
    };

    return x509Identity;
}


module.exports.getWallet = getWallet = async (org) => {
    const walletStore = await WalletMigration.newFileSystemWalletStore("wallet/"+org);
    const oldWallet = new Wallet(walletStore);

    const walletPath = path.join(process.cwd(), "wallet/"+org+"-1");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identityLabels = await oldWallet.list();
    for (const label of identityLabels) {
        const identity = await oldWallet.get(label);
        if (identity) {
            await wallet.put(label, identity);
        }
    }

    return wallet;
}

module.exports.connectToFabric = connectToFabric = async (email) => {
    const wallet = await getWallet("Org1");
    const gateway = new Gateway();

    await gateway.connect(ConnectionProfile, {
        wallet,
        identity: email,
        discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("fabric-token");

    return contract;
}

module.exports.registerIdentity = registerIdentity =  async (emailAddress, firstName, lastName, password) => {

    try {
        const wallet = await getWallet("Org1");
        const registerar = "admin";
        const userExists = await wallet.get(emailAddress);
        if (userExists) {
            console.error(`An identity for the user ${emailAddress} already exists in the wallet`);
            return false;
        }

        
        const gateway = new Gateway();
        await gateway.connect(ConnectionProfile, { wallet, identity: registerar, discovery: { enabled: true, asLocalhost: true } });

        const caName = "Org1CA";
        let caUrl = ConnectionProfile.certificateAuthorities[caName].url;
        let ca = new FabricCAServices(caUrl);
        let adminIdentity = await wallet.get(registerar);
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, registerar);

        const secret = await ca.register({ enrollmentID: emailAddress, role: 'client' }, adminUser);

        const enrollment = await ca.enroll({ enrollmentID: emailAddress, enrollmentSecret: secret });
        const userIdentity = createX509Identity(enrollment, "Org1MSP")
        await wallet.put(emailAddress, userIdentity);

        const salt = await bcrypt.genSalt(10);
        const hashPass = await bcrypt.hash(password, salt);
        console.log(hashPass)
        const contract = await connectToFabric(emailAddress);
        const usrReg = await contract.submitTransaction("createClientWalletAccount", emailAddress, firstName, lastName, hashPass);

        return {success : usrReg.toString(), msg : "User Registered."}
    } catch (error) {
        console.error(error);
        return {success : false, msg : error}
    }
};