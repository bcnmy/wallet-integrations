require("dotenv").config();
const Web3 = require("web3");
const axios = require("axios");
const {abi} = require("./abi");

//Argent Proxy Contract Deployed on Ropsten
const proxyContract = "0x41A89c097e3b02FCd32Bd7aE7222308b29346eB3";

//Argent TransferModole Contract Deployed on Ropsten
const transferModuleContract = "0xD45256EEf4bFB182B108Cd8e0bCB4A9369342C1d";

//Signer public address
const ownerPublicAddress = process.env.ownerPublicAddress;

//Signer private key
const privateKey = process.env.privateKey;

const receiverAddress = "<receiver_address>";
const transferValue = "<amount_in_wei>"; 

const hex = value => web3.utils.toHex(value)
const pad = value => web3.utils.padLeft(value, 64)
const toHex = value => pad(hex(value))

const nativeTransactionUrl = "https://api.biconomy.io/api/v2/meta-tx/native";
let web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/9fc37ecc1a874b9195668327b526a1a7"));


async function relayTransactionViaBiconomy(){

    let TransferModule = new web3.eth.Contract(abi, transferModuleContract);
    let methodData = TransferModule.methods.transferToken(proxyContract, process.env.ETH_TOKEN, receiverAddress, transferValue, process.env.ZERO_ADDRESS).encodeABI()
    const walletAccount = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);      

    const nonce = await getNonceForRelay(web3)
    const signatures = await signOffchain([walletAccount], TransferModule.options.address, proxyContract, 0, methodData, nonce, 0, 0);

    const biconomyReqObj = {
        userAddress: ownerPublicAddress,
        apiId: '<api_id>', //network specific
        params: [proxyContract, methodData, nonce, signatures, 0, 0]
    }

    axios.defaults.headers.common["x-api-key"] = '<x-api-key>'; //network specific

    axios.post(nativeTransactionUrl, biconomyReqObj)
    .then(function(response) {
        if(response && response.data) {
            console.log(response.data);
        } else {
            let error = formatMessage(RESPONSE_CODES.ERROR_RESPONSE, `Unable to get response for api ${nativeTransactionUrl}`);
            console.log(error);
        }
    })
    .catch(function(error) {
        console.log(error)
    });
}

async function getNonceForRelay(web3) {
    const block = await web3.eth.getBlockNumber()
    const timestamp = new Date().getTime()
  
    /** @notice Some Utility functions used by getNonceForRelay */
    const hex = value => web3.utils.toHex(value)
    const pad = value => web3.utils.padLeft(value, 32)
    const toHex = value => pad(hex(value))
    return '0x' + toHex(block).slice(2) + toHex(timestamp).slice(2)
}


async function signOffchain(signers, from, to, value, data, nonce, gasPrice, gasLimit) {
    const input =
      '0x' +
      [
        '0x19',
        '0x00',
        from, // Must be Hex string
        to, // Must be Hex string
        toHex(value), // cannot be hex, as this converts it to hex
        data,
        nonce, // Shoul nonce be like this or below, since multisig executor uses the one below
        // toHex(nonce))
        toHex(gasPrice), // cannot be hex, as this converts it to hex
        toHex(gasLimit) // cannot be hex, as this converts it to hex
      ]
        .map(hex => hex.slice(2)) // Removes all the 0x
        .join('')
  
    const signedData = web3.utils.sha3(input)
    const signatures = signers.map(signer => signer.sign(signedData).signature)
    const signature = '0x' + signatures.map(signature => signature.substring(2)).join('')
  
    return signature
  }

relayTransactionViaBiconomy();