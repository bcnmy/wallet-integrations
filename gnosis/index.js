/* GOAL : Relay Transactions through Biconomy */
require('dotenv').config();
const Biconomy = require("@biconomy/mexa");
const ethers = require('ethers');
const Web3 = require('web3');
const {abi} = require('./abi');


/* Register Dapp onto biconomy dashboard to get the x-api-key
*/
const providerUrl = 'https://kovan.infura.io/v3/' + process.env.INFURA_TOKEN;
const biconomy = new Biconomy(new Web3.providers.HttpProvider(providerUrl),{apiKey: "<x-api-Key>",debug:true});
const web3 = new Web3(biconomy);

const privateKey = process.env.privateKey;
const publicAddress = "<user_public_address>"
const proxyFactoryAddress = '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B'; // kovan
const gnosisSafeAddress = '0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F'; // kovan
const tokenAddress = '0xf676922BA0564B6925bC9142CB30938bAdDb9f18'; // SPK token
const receiverAddress = '<receiver_address>';
const value = '0.01';

/**
 * Get the nonce of proxy contract
 * @param {string} proxyAddress
 * @returns {number} nonce
 */
const getProxyContractNonce = async function(proxyAddress) {
    const proxyContract = new web3.eth.Contract(abi.GnosisSafe, proxyAddress);
    const nonce = await proxyContract.methods.nonce().call();
    console.log('nonce.toNumber():', nonce);
    return nonce;
}

/**
 * Create Proxy Contract
 * @param {string} proxyFactoryAddress
 * @param {string} gnosisSafeAddress
 * @returns {string} proxy address
 */
const createProxyContract = function(proxyFactoryAddress, gnosisSafeAddress) {

    return new Promise(async function (resolve, reject){
            // Get Creation Data
        const gnosisSafeMasterCopy = new web3.eth.Contract(abi.GnosisSafe, gnosisSafeAddress);
        const creationData = gnosisSafeMasterCopy.methods.setup(
            [publicAddress],
            1,
            '0x0000000000000000000000000000000000000000',
            '0x0',
            '0x0000000000000000000000000000000000000000',
            '0x0000000000000000000000000000000000000000',
            0,
            '0x0000000000000000000000000000000000000000',
        ).encodeABI();
        // console.log(creationData);

        // Create Proxy
        const proxyFactory = new web3.eth.Contract(abi.ProxyFactory, proxyFactoryAddress);
        const tx = await proxyFactory.methods.createProxy(gnosisSafeAddress, creationData).encodeABI();
        const extimateGas = await proxyFactory.methods.createProxy(gnosisSafeAddress, creationData).estimateGas();
        
        let txParams = {
            "from": publicAddress,
            "gasLimit": extimateGas,
            "to": proxyFactoryAddress,
            "value": "0x0",
            "data": tx
        };

        // console.log(txParams);

        const signedTx = await web3.eth.accounts.signTransaction(txParams, '0x'+privateKey);
        await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
        .on("transactionHash", async function(hash) {
            console.log(hash);
        }).
        on("error", err => {
            reject(err)
        })
        .once("confirmation", async (confirmation, receipt) => {

            let localProxyAddress = hexStripZeros(receipt.logs[0].data);
            if(localProxyAddress.length < 42) {
                console(`Fixing trailing zeros in address ${localProxyAddress}`);
                localProxyAddress = fixTrailingZero(localProxyAddress);
                console.log(`Fixed address ${localProxyAddress}`);
            }
            resolve(localProxyAddress);
        }); 
    });
}

/**
 * Execute a tx to send ETH from Proxy Contract
 * @param {string} proxyAddress proxy address
 * @param {string} to address
 * @param {string} destination address
 * @param {string} value
 * @param {number} nonce
 * @param {string} gnosisSafeAddress
 * @returns {string} tx hash
 */
const executeTokenTx = async function(proxyAddress, to, destination, value, nonce, gnosisSafeAddress) {
    const proxyContract = new web3.eth.Contract(abi.GnosisSafe, proxyAddress);

    // Set parameters of execTransaction()
    const valueWei = web3.utils.toWei('0', 'ether'); // 0 ETH
    const tokenContract = new web3.eth.Contract(abi.erc20Token, to);
    const data = tokenContract.methods.transfer(destination, web3.utils.toWei(value, 'ether')).encodeABI(); // Encode data of token transfer()
    console.log('Data payload:', data);
    const operation = 0; // CALL
    const gasPrice = 0; // If 0, then no refund to relayer
    const gasToken = '0x0000000000000000000000000000000000000000'; // ETH
    const executor = publicAddress;
    
    let txGasEstimate = 0
    try {
        const gnosisSafeMasterCopy = new web3.eth.Contract(abi.GnosisSafe, gnosisSafeAddress);
        const estimateData = gnosisSafeMasterCopy.methods.requiredTxGas(to, valueWei, data, operation).encodeABI();

        const estimateResponse = await web3.eth.call({to: proxyAddress, from: proxyAddress, data: estimateData, gasPrice: 0});
        txGasEstimate = new web3.utils.BN(estimateResponse.substring(138), 16);
        txGasEstimate = txGasEstimate.toNumber() + 10000; // Add 10k else we will fail in case of nested calls
        console.log("Safe Tx Gas estimate: " + txGasEstimate);
    } catch(e) {
        console.log("Could not estimate gas");
    }
    // Get estimated base gas (Gas costs for that are indipendent of the transaction execution(e.g. base transaction fee, signature check, payment of the refund))
    let baseGasEstimate = 0; // If one of the owners executes this transaction it is not really required to set this (so it can be 0) TODO: if using erc20 token
    
    // Create typed data hash
    const transactionHash = await proxyContract.methods.getTransactionHash(
        to, valueWei, data, operation, txGasEstimate, baseGasEstimate, gasPrice, gasToken, executor, nonce,
    ).call();

    console.log('Transaction hash (typed data):', transactionHash);
    console.log('0x'+privateKey);
    const signature = await web3.eth.accounts.sign(transactionHash.toString(), '0x'+privateKey);
    
    // v + 4
    const sig = ethers.utils.splitSignature(signature);
    const newSignature = `${sig.r}${sig.s.substring(2)}${Number(sig.v + 4).toString(16)}`;
    console.log('Signature 2:', newSignature);

    // Call proxy contract to execute Tx
    console.log('-----Execute Tx');
    const tx = await proxyContract.methods.execTransaction(
        to, valueWei, data, operation, txGasEstimate, baseGasEstimate, gasPrice, gasToken, executor, newSignature,
    ).encodeABI();

    let txParams = {
        "from": publicAddress,
        "gasLimit": web3.utils.toHex(210000),
        "to": proxyAddress,
        "value": "0x0",
        "data": tx
    };

    // console.log(txParams);

    const signedTx = await web3.eth.accounts.signTransaction(txParams, '0x'+privateKey);
    let txHash;
    let receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction, (error, _txHash)=>{
        if(error) {
            return console.error(error);
        }
        txHash = _txHash;
    });
    console.log(txHash);

    return txHash;
}

biconomy.onEvent(biconomy.READY, async() => {
    // Initialize your dapp here like getting user accounts etc
    console.log("biconomy initialized");

    // create proxy
    // let proxyAddress = await createProxyContract(proxyFactoryAddress, gnosisSafeAddress)

    // Get current nonce
    const nonce = await getProxyContractNonce(proxyAddress);

    // Execute tx 
    const txHash = await executeTokenTx(
        proxyAddress,
        tokenAddress,
        receiverAddress,
        value,
        nonce,
        gnosisSafeAddress,
    );
    console.log('Withdraw <value> erc20 token:', txHash);

}).onEvent(biconomy.ERROR, (error, message) => {
    console.log(error,message)
    // Handle error while initializing mexa
  });

const fixTrailingZero = (address) => {
    let trailingZero = "";
    for(let index = 0; index < (42-address.length); index++) trailingZero += "0";
    return `${address.substring(0,2)}${trailingZero}${address.substring(2,address.length)}`;
}

const hexStripZeros = (value) => {
    if (!web3.utils.isHex(value)) {
        throw new Error('invalid hex string', { arg: 'value', value: value });
    }
    while (value.length > 3 && value.substring(0, 3) === '0x0') {
        value = '0x' + value.substring(3);
    }
    return value;
}
