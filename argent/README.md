## Biconomy support for Argent contract wallets 

This repository consists of integration between Argent Wallets and Biconomy Relayer Infrastructure.<br/>
It showcases how any DApp using Argent contract wallets can use Biconomy as a relayer service to relay the transactions without creating a relayer infrastructure by themselves.

>Note : The contract address in this demo are deployed on ropsten. If you are using other Network ,replace it with your own deployed addresses.

<h3>To Run</h3>

Install all Dependencies

`npm install`

<h5> .env Changes</h5>

1. Add .env file to the project. Refer the .env.sample file.

2. Add `ownerPublicAddress  , privateKey` in .env.

3. Add `ETH_TOKEN` to .env

For ETH transfer value is `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` and for ERC20 transfer replace it with the Token contract address.

<h5>index.js Changes </h5>

1. Replace `proxyContract` & `transferModuleContract` with your deployed contract addresses or use the same for testing.

2. Replace `receiverAddress` & `transferValue` as per own requirement.

3. Replace the web3 provider according to the your testing network.

4. To add `apiId` & `x-api-key` 

    4.1. Register/Login to [Biconomy Dashboard](https://dashboard.biconomy.io/)
    
    4.2. Verify Email and create your Dapp, this will create `x-api-key`.
    
    4.3. Add <strong>Argent TransferModule contract</strong> address and ABI.
    
    4.4. Now add your api under "Manage section" and select the "native flag". This will create the `apiId`.
    
  
For more detailed tutorial, Refer to our [docs](https://docs.biconomy.io/biconomy-dashboard#lets-get-started).

### Now you are all set to run the script
`node index.js`

