
'use strict';

const { Contract } = require('fabric-contract-api');

const WalletAccount = require('./token-wallet-account');

const balancePrefix = 'balance';
const allowancePrefix = 'allowance';
const accPrefix = 'walletAcc';

const nameKey = 'name';
const symbolKey = 'symbol';
const decimalsKey = 'decimals';
const totalSupplyKey = 'totalSupply';

class TokenContract extends Contract {

    
    async TokenName(ctx) {
        const nameBytes = await ctx.stub.getState(nameKey);
        return nameBytes.toString();
    }

    async Symbol(ctx) {
        const symbolBytes = await ctx.stub.getState(symbolKey);
        return symbolBytes.toString();
    }

    async Decimals(ctx) {
        const decimalsBytes = await ctx.stub.getState(decimalsKey);
        const decimals = parseInt(decimalsBytes.toString());
        return decimals;
    }

    async TotalSupply(ctx) {
        const totalSupplyBytes = await ctx.stub.getState(totalSupplyKey);
        const totalSupply = parseInt(totalSupplyBytes.toString());
        return totalSupply;
    }

    async BalanceOf(ctx, ownEmail) {
        const balanceKey = ctx.stub.createCompositeKey(balancePrefix, [ownEmail]);

        const balanceBytes = await ctx.stub.getState(balanceKey);
        if (!balanceBytes || balanceBytes.length === 0) {
            throw new Error(`the account ${ownEmail} does not exist`);
        }
        const balance = parseInt(balanceBytes.toString());

        return balance;
    }

    async Transfer(ctx, toEmail, value) {
        const from = ctx.clientIdentity.getID();
        const fromAccKey = ctx.stub.createCompositeKey(accPrefix, [from]);
        const fromAcc = await ctx.stub.getState(fromAccKey);
        const fromEmail = (JSON.parse(fromAcc.toString())).email
        const transferResp = await this._transfer(ctx, fromEmail, toEmail, value);
        if (!transferResp) {
            throw new Error('Failed to transfer');
        }

        const transferEvent = { fromEmail, toEmail, value: parseInt(value) };
        ctx.stub.setEvent('Transfer', Buffer.from(JSON.stringify(transferEvent)));

        return true;
    }

    async TransferFrom(ctx, fromEmail, toEmail, value) {
        const spender = ctx.clientIdentity.getID();
        const spenAccKey = ctx.stub.createCompositeKey(accPrefix, [spender])
        const spenAcc = await ctx.stub.getState(spenAccKey);
        const spenEmail = (JSON.parse(spenAcc.toString())).email;
        const allowanceKey = ctx.stub.createCompositeKey(allowancePrefix, [fromEmail, spenEmail]);
        const currentAllowanceBytes = await ctx.stub.getState(allowanceKey);

        if (!currentAllowanceBytes || currentAllowanceBytes.length === 0) {
            throw new Error(`spender ${spenEmail} has no allowance from ${fromEmail}`);
        }

        const currentAllowance = parseInt(currentAllowanceBytes.toString());

        const valueInt = parseInt(value);

        if (currentAllowance < valueInt) {
            throw new Error('The spender does not have enough allowance to spend.');
        }

        const transferResp = await this._transfer(ctx, fromEmail, toEmail, value);
        if (!transferResp) {
            throw new Error('Failed to transfer');
        }

        const updatedAllowance = currentAllowance - valueInt;
        await ctx.stub.putState(allowanceKey, Buffer.from(updatedAllowance.toString()));
        console.log(`spender ${spenPubKey} allowance updated from ${currentAllowance} to ${updatedAllowance}`);

        const transferEvent = { fromEmail, toEmail, value: valueInt };
        ctx.stub.setEvent('Transfer', Buffer.from(JSON.stringify(transferEvent)));

        console.log('transferFrom ended successfully');
        return true;
    }

    async _transfer(ctx, from, to, value) {

        const valueInt = parseInt(value);

        if (valueInt < 0) { 
            throw new Error('transfer amount cannot be negative');
        }

        const fromBalanceKey = ctx.stub.createCompositeKey(balancePrefix, [from]);
        const fromCurrentBalanceBytes = await ctx.stub.getState(fromBalanceKey);

        if (!fromCurrentBalanceBytes || fromCurrentBalanceBytes.length === 0) {
            throw new Error(`client account ${from} has no balance`);
        }

        const fromCurrentBalance = parseInt(fromCurrentBalanceBytes.toString());

        if (fromCurrentBalance < valueInt) {
            throw new Error(`client account ${from} has insufficient funds.`);
        }

        const toBalanceKey = ctx.stub.createCompositeKey(balancePrefix, [to]);
        const toCurrentBalanceBytes = await ctx.stub.getState(toBalanceKey);

        let toCurrentBalance;
        if (!toCurrentBalanceBytes || toCurrentBalanceBytes.length === 0) {
            toCurrentBalance = 0;
        } else {
            toCurrentBalance = parseInt(toCurrentBalanceBytes.toString());
        }

        const fromUpdatedBalance = fromCurrentBalance - valueInt;
        const toUpdatedBalance = toCurrentBalance + valueInt;

        await ctx.stub.putState(fromBalanceKey, Buffer.from(fromUpdatedBalance.toString()));
        await ctx.stub.putState(toBalanceKey, Buffer.from(toUpdatedBalance.toString()));

        console.log(`client ${from} balance updated from ${fromCurrentBalance} to ${fromUpdatedBalance}`);
        console.log(`recipient ${to} balance updated from ${toCurrentBalance} to ${toUpdatedBalance}`);

        return true;
    }

    
    async Approve(ctx, spenEmail, value) {
        const owner = ctx.clientIdentity.getID();
        const ownAccKey = ctx.stub.createCompositeKey(accPrefix, [owner]);
        const ownAcc = await ctx.stub.getState(ownAccKey);
        const ownKey = (JSON.parse(ownAcc.toString())).email
        const allowanceKey = ctx.stub.createCompositeKey(allowancePrefix, [ownKey, spenEmail]);

        let valueInt = parseInt(value);
        await ctx.stub.putState(allowanceKey, Buffer.from(valueInt.toString()));

        const approvalEvent = { ownKey, spenEmail, value: valueInt };
        ctx.stub.setEvent('Approval', Buffer.from(JSON.stringify(approvalEvent)));

        console.log('approve ended successfully');
        return true;
    }

    
    async Allowance(ctx, ownEmail, spenEmail) {
        const allowanceKey = ctx.stub.createCompositeKey(allowancePrefix, [ownEmail, spenEmail]);

        const allowanceBytes = await ctx.stub.getState(allowanceKey);
        if (!allowanceBytes || allowanceBytes.length === 0) {
            throw new Error(`spender ${spenEmail} has no allowance from ${ownEmail}`);
        }

        const allowance = parseInt(allowanceBytes.toString());
        return allowance;
    }

    
    async SetOption(ctx, name, symbol, decimals) {
        await ctx.stub.putState(nameKey, Buffer.from(name));
        await ctx.stub.putState(symbolKey, Buffer.from(symbol));
        await ctx.stub.putState(decimalsKey, Buffer.from(decimals));

        console.log(`name: ${name}, symbol: ${symbol}, decimals: ${decimals}`);
        return true;
    }

    async Mint(ctx, amount) {

        const clientMSPID = ctx.clientIdentity.getMSPID();
        if (clientMSPID !== 'Org1MSP') {
            throw new Error('client is not authorized to mint new tokens');
        }

        const minter = ctx.clientIdentity.getID();
        const mintAccKey = ctx.stub.createCompositeKey(accPrefix, [minter]);
        const minterAcc = await ctx.stub.getState(mintAccKey);
        const minterKey = (JSON.parse(minterAcc.toString())).email

        const amountInt = parseInt(amount);
        if (amountInt <= 0) {
            throw new Error('mint amount must be a positive integer');
        }

        const balanceKey = ctx.stub.createCompositeKey(balancePrefix, [minterKey]);

        const currentBalanceBytes = await ctx.stub.getState(balanceKey);
        let currentBalance;
        if (!currentBalanceBytes || currentBalanceBytes.length === 0) {
            currentBalance = 0;
        } else {
            currentBalance = parseInt(currentBalanceBytes.toString());
        }
        const updatedBalance = currentBalance + amountInt;

        await ctx.stub.putState(balanceKey, Buffer.from(updatedBalance.toString()));

        const totalSupplyBytes = await ctx.stub.getState(totalSupplyKey);
        let totalSupply;
        if (!totalSupplyBytes || totalSupplyBytes.length === 0) {
            console.log('Initialize the tokenSupply');
            totalSupply = 0;
        } else {
            totalSupply = parseInt(totalSupplyBytes.toString());
        }
        totalSupply = totalSupply + amountInt;
        await ctx.stub.putState(totalSupplyKey, Buffer.from(totalSupply.toString()));

        const transferEvent = { from: '0x0', to: minterKey, value: amountInt };
        ctx.stub.setEvent('Transfer', Buffer.from(JSON.stringify(transferEvent)));

        console.log(`minter account ${minterKey} balance updated from ${currentBalance} to ${updatedBalance}`);
        return true;
    }

    async Burn(ctx, amount) {

        const clientMSPID = ctx.clientIdentity.getMSPID();
        if (clientMSPID !== 'Org1MSP') {
            throw new Error('client is not authorized to mint new tokens');
        }

        const minter = ctx.clientIdentity.getID();
        const mintAccKey = ctx.stub.createCompositeKey(accPrefix, [minter]);
        const minterAcc = await ctx.stub.getState(mintAccKey);
        const minterKey = (JSON.parse(minterAcc.toString())).email

        const amountInt = parseInt(amount);

        const balanceKey = ctx.stub.createCompositeKey(balancePrefix, [minterKey]);

        const currentBalanceBytes = await ctx.stub.getState(balanceKey);
        if (!currentBalanceBytes || currentBalanceBytes.length === 0) {
            throw new Error('The balance does not exist');
        }
        const currentBalance = parseInt(currentBalanceBytes.toString());
        const updatedBalance = currentBalance - amountInt;

        await ctx.stub.putState(balanceKey, Buffer.from(updatedBalance.toString()));

        const totalSupplyBytes = await ctx.stub.getState(totalSupplyKey);
        if (!totalSupplyBytes || totalSupplyBytes.length === 0) {
            throw new Error('totalSupply does not exist.');
        }
        const totalSupply = parseInt(totalSupplyBytes.toString()) - amountInt;
        await ctx.stub.putState(totalSupplyKey, Buffer.from(totalSupply.toString()));

        const transferEvent = { from: minterKey, to: '0x0', value: amountInt };
        ctx.stub.setEvent('Transfer', Buffer.from(JSON.stringify(transferEvent)));

        console.log(`minter account ${minterKey} balance updated from ${currentBalance} to ${updatedBalance}`);
        return true;
    }   

    async createClientWalletAccount (ctx, email, fname, lname, pass) {
        let clientId = ctx.clientIdentity.getID();
        const walletAccount = new WalletAccount(clientId, email, fname, lname, pass);
        const accKey = ctx.stub.createCompositeKey(accPrefix, [walletAccount.clientId])
        const accBytes = await ctx.stub.getState(accKey)
        if (!accBytes || accBytes.length === 0) {
            await ctx.stub.putState(accKey, Buffer.from(JSON.stringify(walletAccount)));
            return true;
        }
        else {
            throw new Error("Client Wallet account already exists");
        }
    }

    async getWalletAccount (ctx) {
        const clientId = ctx.clientIdentity.getID();
        const accKey = ctx.stub.createCompositeKey(accPrefix, [clientId]);
        const acc = await ctx.stub.getState(accKey);

        if (!acc || acc.length === 0) {
            throw new Error("Client wallet account does not exist.")
        }
    
        return JSON.parse(acc.toString())
    }

    async ClientAccountBalance(ctx) {
        const clientAccountID = ctx.clientIdentity.getID();
        const clientAccKey = ctx.stub.createCompositeKey(accPrefix, [clientAccountID]);
        const clientAcc = await ctx.stub.getState(clientAccKey);
        const clientEmail = (JSON.parse(clientAcc.toString())).email
        const balanceKey = ctx.stub.createCompositeKey(balancePrefix, [clientEmail]);
        const balanceBytes = await ctx.stub.getState(balanceKey);
        if (!balanceBytes || balanceBytes.length === 0) {
            throw new Error(`the account ${clientAccountID} has no balance`);
        }
        const balance = parseInt(balanceBytes.toString());

        return balance;
    }

    async ClientAccountID(ctx) {
        const clientAccountID = ctx.clientIdentity.getID();
        return clientAccountID;
    }

    async getTransactionHistory (ctx) {
        const id = ctx.clientIdentity.getID();
        const accKey = ctx.stub.createCompositeKey(accPrefix, [id]);
        const acc = await ctx.stub.getState(accKey);
        const accPubKey = (JSON.parse(acc.toString())).email
        const balanceKey = ctx.stub.createCompositeKey(balancePrefix, [accPubKey]);
        const historyIterator = await ctx.stub.getHistoryForKey(balanceKey);
        let allResults = [];
        while (true) {
            let res = await historyIterator.next()
            if (res.value && res.value.value.toString()) {
            let jsonRes = {};
            console.log(res.value.value.toString('utf8'), res.toString(), res);
            jsonRes.tx_id = res.value.tx_id;
            try {
                jsonRes.balance = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
                console.log(err);
                jsonRes.balance = res.value.value.toString('utf8');
            }
            allResults.push(jsonRes);
            }
            if (res.done) {
            console.log('end of data');
            await historyIterator.close();
            console.log(allResults);
            return allResults;
            }
        }
    }

}

module.exports = TokenContract;