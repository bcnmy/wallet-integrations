## Argent Wallet <> Biconomy Integration

This reposiroty consists of integration between Argent Wallets and Biconomy Relayer Infrastructure.<br/>
It showcases how any DApp using Argent contract wallets can use Biconomy as a relayer service to relay the transactions without creating a relayer infrastructure by themselves.

>Note : The contract address in this demo are deployed on koven. If you are using other Network ,replace it with own deployed address.

<h3>To Run</h3>

<h5> .env Changes</h5>

1. Add .env file to the project. Refer the .env.sample file.

2. Add `ownerPublicAddress  , privateKey` in .env.

3. Add `ETH_TOKEN` to .env. For ETH transfer value is `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` and for ERC20 transfer replace it with the Token contract address.

<h5>index.js Changes </h5>

1. Replace `proxyContract` & `transferModuleContract` with your deployed contract addresses or use the same for testing.

2. Replace `receiverAddress` & `transferValue` as per own requirement.

3. Replace the web3 provider according to the your testing network.

4. Login to [Biconomy Dashboard](https://dashboard.biconomy.io/), add <strong>Argent TransferModule contract</strong>, copy  `apiId` & `x-api-key`. Repalce the same in the file. 
Refer our [docs](https://docs.biconomy.io/biconomy-dashboard#lets-get-started) to register and add contracts on dashboard.
