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
const TransactionSerializer = require('./TransactionSerializer');

const PROXY_WALLET_ADDRESS = '0x791f2b5a5b44779dc5950c6fc619ce2d50928cfe';
const MELON_CONDITIONAL_ADDRESS = '0xb78d54d5578f94171afc6cedcd59b1e53d71dbf8';
const FUND_ADDRESS = '0x733c3696086926ebba057723f22aff2c12fb803e';
const MOCK_PRICE_FEED = '0x00d67533e08b7ed97577e364f4b8eb4932e980b5';
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

    const serializer = new TransactionSerializer();

    const endowment = callGas * gasPrice;

    return {
        data: serializer.serialize(
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

function showFinalSchedulingMessage({ sellAssetSymbol, buyAssetSymbol, priceToTriggerOrder, receipt }) {
    console.log(`
STOP LOSS SUCESSFULLY SETUP.

"${sellAssetSymbol}" will be sold for "${buyAssetSymbol}" when the price of "${sellAssetSymbol}" drops to ${priceToTriggerOrder}.

Tx hash: ${receipt.transactionHash}
    `);
}

async function setupStopLoss({ account, exchange, fund, buyAssetSymbol, priceToTriggerOrder, sellAssetSymbol }) {
    const buyAssetAddress = tokenInfo.kovan[buyAssetSymbol].address;
    const sellAssetAddress = tokenInfo.kovan[sellAssetSymbol].address;

    const fundContract = await pApi.newContract(FundABI, fund);

    const priceFeedAddress = MOCK_PRICE_FEED; // getFundPriceFeedAddress(fundContract)
    const priceFeed = await pApi.newContract(PriceFeedInterfaceABI, priceFeedAddress);

    const sellAssetPrice = await getAssetPrice(priceFeed, sellAssetAddress);

    // SELL ALL | CAN BE CUSTOMIZED IN FUTURE
    const sellAssetQuantity = await getFundHeldAssetQuantity(fund, sellAssetAddress);

    console.log('sellAssetPrice', sellAssetPrice.toFixed());

    console.log('held', sellAssetQuantity.toFixed());

    const buyQuantity = sellAssetQuantity.div(10**18).mul(sellAssetPrice);

    console.log('buy quantity', buyQuantity.toFixed());

    const makeOrderCallData = w3.utils.asciiToHex(fundContract.getCallData(fundContract.instance.makeOrder, {}, [
        exchange,
        sellAssetAddress,
        buyAssetAddress,
        sellAssetQuantity,
        buyQuantity
    ]));

    const melonConditional = new pApi.newContract(MelonConditionalABI, MELON_CONDITIONAL_ADDRESS);

    const conditionalCallData = melonConditional.getCallData(melonConditional.instance.check, {}, [
        priceFeedAddress,
        sellAssetAddress,
        priceToTriggerOrder,
        '<='
    ]);

    const proxyWallet = new w3.eth.Contract(require('./build/contracts/Proxy_Wallet.json').abi, PROXY_WALLET_ADDRESS);

    const proxyCallData = proxyWallet.methods.proxy(fund, makeOrderCallData).encodeABI();

    const { data: serializedScheduledTransaction, value } = getSerializedScheduledTransaction({
        callGas: 400000,
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
    const defaultAccount = (await pApi.eth.accounts())[ACCOUNT_INDEX];
    const balance = await pApi.eth.getBalance(defaultAccount);
    console.log(`
Using account: ${defaultAccount}
Account balance: ${balance/10**18}${etherSymbol}`);

    await setupStopLoss({
        account: defaultAccount,
        fund: FUND_ADDRESS,
        sellAssetSymbol: 'WETH-T',
        buyAssetSymbol: 'MLN-T',
        priceToTriggerOrder: 100,
        exchange: 0
    });
}

try {
    main();
} catch (error) {
    console.error(error);
}
