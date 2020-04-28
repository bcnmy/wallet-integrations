## Biconomy support for Gnosis contract wallet

This repository consists of integration between Gnosis Wallets and Biconomy Relayer Infrastructure.<br/>
It showcases how any DApp using Gnosis contract wallets can use Biconomy as a relayer service to relay the transactions without creating a relayer infrastructure by themselves.

>Note : The contract address in this demo are deployed on Koven. If you are using other Network ,feel free to change it.

<h3>To Run</h3>

Install all Dependencies

`npm install`

Install all Biconomy SDK (Mexa)

`npm install @biconomy/mexa --save`

<h5> .env Changes</h5>

1. Add .env file to the project. Refer the .env.sample file.

2. Add `INFURA_TOKEN , privateKey` in .env.

<h5>abi.js Changes </h5>

1. Gnosis's `ProxyFactory` , `GnosisSafe` abi is already added. `ProxyFactory` is used to create the Proxy contract (GnosisSafe). `GnosisSafe` is the Proxy contract unique for each user.

2. Replace `erc20Token` abi as per your ERC20 token address

<h5>index.js Changes </h5>

1. Replace `providerUrl` as per the network your are using.

2. Replace ` gnosisSafeAddress` & `tokenAddress` with your deployed contract addresses or use the same for testing.

> Network Specific gnosisSafeAddress ,Please follow this https://github.com/gnosis/safe-contracts/tree/development/.openzeppelin 

3. Replace `publicAddress , proxyAddress` & `receiverAddress` as per own requirement.

4. To add `x-api-key` 

    4.1. Register/Login to [Biconomy Dashboard](https://dashboard.biconomy.io/)
    
    4.2. Verify Email and create your Dapp, this will create `x-api-key`.
    
    4.3. Add <strong>GnosisSafe</strong> contract under `SCW` with name and ABI.
    
    4.4. Now add `execTransaction` method under `Manage APIs`.
    
  
For more details on "Register dapp`, Refer to our [docs](https://docs.biconomy.io/biconomy-dashboard#lets-get-started).

### Now you are all set to run the script
`node index.js`

