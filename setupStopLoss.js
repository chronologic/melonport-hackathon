const parityApi = require('@parity/api');

/** Web3 setup */
const Web3 = require('web3');
const w3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
const w3 = new Web3(w3Provider);
/** */

/** Parity provider set up */
const provider = new parityApi.Provider.Http('http://localhost:8545');
const pApi = new parityApi(provider);

const PriceFeedInterfaceABI = require('./abis/PriceFeedInterface');
const FundABI = require('./abis/FundInterface');
const AssetABI = require('./abis/AssetInterface');
const MelonConditionalABI = require('./abis/MelonConditional');
const tokenInfo = require('./node_modules/@melonproject/smart-contracts/utils/info/tokenInfo');
const TransactionScanner = require('./TransactionScanner');

const BigNumber = require('bignumber.js');

const PROXY_WALLET_ADDRESS = '0x791f2b5a5b44779dc5950c6fc619ce2d50928cfe';
const MELON_CONDITIONAL_ADDRESS = '0xb78d54d5578f94171afc6cedcd59b1e53d71dbf8';
const FUND_ADDRESS = '0xe9f0237826557e2532aa86fdc1ab0ad0c50f29f7';
const etherSymbol = 'Ξ';
const ACCOUNT_INDEX = 1;

async function getFundPriceFeedAddress(fund) {
    return (await fund.instance.getModules.call())[0];
}

async function getAssetPrice(priceFeed, assetAddress) {
    const [, price] = await priceFeed.instance.getPrice.call({}, [assetAddress]);

    return price;
}

async function getFundHeldAssetQuantity(fund, assetAddress) {
    const asset = await pApi.newContract(AssetABI, assetAddress);

    return await asset.instance.balanceOf.call({}, [fund]);
}

function getSerializedScheduledTransaction({
    callGas,
    gasPrice,
    toAddress,
    conditionCheckAddress,
    conditionalCallData,
    callData
}) {
    const EXECUTION_WINDOW_START = 7346109;

    const transactionScanner = new TransactionScanner();

    const endowment = callGas * gasPrice;

    return {
        data: transactionScanner.serialize(
            1,
            toAddress,
            0,
            callGas,
            gasPrice,
            EXECUTION_WINDOW_START,
            9999,
            0,
            0,
            conditionCheckAddress,
            callData,
            conditionalCallData
        ),
        value: endowment
    };
}

function humanizeNumberDisplay(number) {
    const bn = new BigNumber(number);

    return bn.div(10**18).toFixed(2);
}

function showFinalSchedulingMessage({ sellAssetSymbol, buyAssetSymbol, priceToTriggerOrder, receipt }) {
    console.log(`
STOP LOSS SUCESSFULLY SETUP.

"${sellAssetSymbol}" will be sold for "${buyAssetSymbol}" when the price of "${sellAssetSymbol}" drops to ${humanizeNumberDisplay(priceToTriggerOrder)}.

Tx hash: ${receipt.transactionHash}
    `);
}

async function setupStopLoss({ account, exchange, fund, buyAssetSymbol, priceToTriggerOrder, sellAssetSymbol }) {
    // console.log(tokenInfo.kovan)
    const buyAssetAddress = '0xa27Af8713623fCc239d49108B1A7b187c133e88B'//tokenInfo.kovan.find(token => token.symbol === buyAssetSymbol).address;
    const sellAssetAddress = '0x9f9e3342b8666859625b1a1b90a319e9f7784c2f'//tokenInfo.kovan.find(token => token.symbol === sellAssetSymbol).address;

    const fundContract = await pApi.newContract(FundABI, fund);

    const priceFeedAddress = '0x9f9e3342b8666859625b1a1b90a319e9f7784c2f'
    // const priceFeedAddress = await getFundPriceFeedAddress(fundContract);
    const priceFeed = await pApi.newContract(PriceFeedInterfaceABI, priceFeedAddress);

    const sellAssetPrice = 100// await getAssetPrice(priceFeed, sellAssetAddress);

    //SELL ALL | CAN BE CUSTOMIZED IN FUTURE
    const sellAssetQuantity = await getFundHeldAssetQuantity(fund, sellAssetAddress);

    console.log('sellAssetPrice', sellAssetPrice.toFixed());

    console.log('held', sellAssetQuantity.toFixed());

    const buyQuantity = sellAssetQuantity.div(10**18).mul(sellAssetPrice);

    console.log('buy Quantity', buyQuantity.toFixed());

    const makeOrderCallData = fundContract.getCallData(fundContract.instance.makeOrder, {}, [
        exchange,
        sellAssetAddress,
        buyAssetAddress,
        sellAssetQuantity,
        buyQuantity
    ]);

    // console.log('scheduled tx call data (fundContract.makeOrder)', makeOrderCallData);

    const melonConditional = new pApi.newContract(MelonConditionalABI, MELON_CONDITIONAL_ADDRESS);

    const conditionalCallData = melonConditional.getCallData(melonConditional.instance.check, {}, [
        priceFeedAddress,
        sellAssetAddress,
        sellAssetPrice,
        '<='
    ]);

    const proxyWallet = new w3.eth.Contract(require('./build/contracts/Proxy_Wallet.json').abi, PROXY_WALLET_ADDRESS);

    const proxyCallData = proxyWallet.methods.proxy(fund, makeOrderCallData).encodeABI();

    const { data: serializedScheduledTransaction, value } = getSerializedScheduledTransaction({
        callGas: 300000,
        gasPrice: pApi.util.toWei('2', 'shannon').toFixed(),
        toAddress: PROXY_WALLET_ADDRESS,
        conditionCheckAddress: MELON_CONDITIONAL_ADDRESS,
        conditionalCallData,
        callData: proxyCallData
    });

    const receipt = await proxyWallet.methods.schedule(serializedScheduledTransaction).send({
        from: account,
        gasLimit: 777666,
        value
    });

    showFinalSchedulingMessage({
        sellAssetSymbol,
        buyAssetSymbol,
        priceToTriggerOrder,
        receipt
    });
}

async function main() {
    const defaultAccount = (await pApi.eth.accounts())[0];
    const balance = await pApi.eth.getBalance(defaultAccount);
    console.log(`
Using account: ${defaultAccount}
Account balance: ${balance/10**18}${etherSymbol}`);

    await setupStopLoss({
        account: defaultAccount,
        fund: FUND_ADDRESS,
        sellAssetSymbol: 'MLN-T-M',
        buyAssetSymbol: 'ETH-T-M',
        priceToTriggerOrder: '10000001200836273000',
        exchange: 0
    });
}

try {
    main();
} catch (error) {
    console.error(error);
}
