const fs = require('fs')

const parityApi = require('@parity/api')
// const pContract = require('@parity/api/lib/contract')

/** Web3 setup */
const Web3 = require('web3')
const w3Provider = new Web3.providers.HttpProvider('http://localhost:8545')
const w3 = new Web3(w3Provider)
/** */

/** Parity provider set up */
const provider = new parityApi.Provider.Http('http://localhost:8545')///#/auth?token=1f1Q-I0Hb-C50r-Gb3x')
const pApi = new parityApi(provider)
// const PriceFeedInterfaceABI = require('./abis/PriceFeedInterface');
// const FundABI = require('./abis/FundInterface');
// const AssetABI = require('./abis/AssetInterface');
// const MelonConditionalABI = require('./abis/MelonConditional');
// const ProxyWalletABI = require('./abis/ProxyWallet');
// const tokenInfo = require('./smart-contracts/utils/info/tokenInfo');
const TransactionScanner = require('./TransactionScanner');

/** Ether currency symbol */
const etherSymbol = 'Ξ';

/** Constants */
const MELON_T_ADDR = '0xDC5fC5DaB642f688Bc5BB58bEF6E0d452D7ae123'
const ETH_T_ADDR = '0xa27Af8713623fCc239d49108B1A7b187c133e88B'

/** Kovan contracts */
const kovan = require('./addressBook.json').kovan
// console.log(kovan)

let defaultAccount;

/** Main */
const main = async () => {
    defaultAccount = (await pApi.eth.accounts())[0]
    const balance = await pApi.eth.getBalance(defaultAccount)
    console.log(`
Using account: ${defaultAccount}
Account balance: ${balance/10**18}${etherSymbol}`)

    /** Deploy a new Melon fund */
    const opts = {
        from: defaultAccount,
        gas: 7000000,
        gasPrice: pApi.util.toWei('2', 'shannon'), // shannon === gwei... parity prefers the shannon terminology
    }

    /** Deploy the proxy wallet, which will be the fund manager */
    const pWalletAddr = '0xb6e014922fc35399994953908f91503c85a28abb'
    // const proxyWallet = new w3.eth.Contract(require('./build/contracts/Proxy_Wallet.json').abi, pWalletAddr)

    /** Construct the call data for deploying a melon fund from the proxy */
    const Version = new w3.eth.Contract(require('./out/version/Version.abi.json'), kovan.Version)
    // const tx = await Version.methods.setupFund(
    //     '0x1337',
    //     ETH_T_ADDR,
    //     0,
    //     0,
    //     kovan.NoCompliance,
    //     kovan.RMMakeOrders,
    //     [
    //         kovan.ZeroExExchange,
    //     ],
    //     []
    // ).send(opts)
    // console.log(tx)

    // const canonicalPriceFeed = new w3.eth.Contract(require('./out/CanonicalPriceFeed.abi.json'), kovan.CanonicalPriceFeed)
    // const lastUpdateTime = await canonicalPriceFeed.methods.lastUpdateTime().call()
    // const quoteAsset = await canonicalPriceFeed.methods.getQuoteAsset().call()
    // console.log('Last Updated Time: ' + lastUpdateTime)
    // console.log('Quote Asset: ' + quoteAsset)

    const Fund = new w3.eth.Contract(require('./out/Fund.abi.json'))

    const deployFundOpts = Object.assign(
        {
            data: '0x' + fs.readFileSync('./out/Fund.bin').toString(),
            arguments: [
                pWalletAddr, //ofManager
                w3.utils.sha3('1337'), //withName
                ETH_T_ADDR, //ofQuoteAsset
                0, //ofManagementFee
                0, //ofPerformanceFee
                kovan.NoCompliance, //ofCompliance,
                kovan.RMMakeOrders, //ofRiskMgmt,
                kovan.CanonicalPriceFeed, //ofPriceFee,
                [ //ofExchanges
                    kovan.MatchingMarket,
                ],
                []
            ]
        },
        opts,
    )

    const f = await Fund.deploy(
        deployFundOpts,
    ).send(opts)

    console.log(f)
}

    // const Pricefeed = new w3.eth.Contract(JSON.parse(fs.readFileSync('./out/PriceFeedInterface.abi')))
    // Pricefeed.options.address = '0x288A9fB92921472D29ab0b3C3e420a8E4Bd4f452'
    // console.log(
    //     await Pricefeed.methods.getQuoteAsset().call()
    // )
    // const deployPricefeedOpts = Object.assign(
    //     {
    //         data: '0x' + fs.readFileSync('./out/Pricefeed.bin').toString()
    //     }
    // )

    // await setupStopLoss({
    //     fund: '0x3BeBf94Ab7e9Da434137EFb8226eA8d50AA97389',
    //     sellAssetSymbol: 'ETH-T-M',
    //     buyAssetSymbol: 'MLN-T-M',
    //     priceToTriggerOrder: '10000001200836273000',
    //     exchange: 0
    // });

// async function getFundPriceFeedAddress(fund) {
//     return (await fund.instance.getModules.call())[0];
// }

// async function getAssetPrice(priceFeed, assetAddress) {
//     const [, price] = await priceFeed.instance.getPrice.call({}, [assetAddress]);

//     return price;
// }

// async function getFundHeldAssetQuantity(fund, assetAddress) {
//     const asset = await pApi.newContract(AssetABI, assetAddress);

//     return await asset.instance.balanceOf.call({}, [fund]);
// }

// async function setupStopLoss({ exchange, fund, buyAssetSymbol, priceToTriggerOrder, sellAssetSymbol }) {
//     const buyAssetAddress = tokenInfo.kovan.find(token => token.symbol === buyAssetSymbol).address;
//     const sellAssetAddress = tokenInfo.kovan.find(token => token.symbol === sellAssetSymbol).address;

//     const fundContract = await pApi.newContract(FundABI, fund);

//     const priceFeedAddress = await getFundPriceFeedAddress(fundContract);
//     const priceFeed = await pApi.newContract(PriceFeedInterfaceABI, priceFeedAddress);

//     const sellAssetPrice = await getAssetPrice(priceFeed, sellAssetAddress);

    // SELL ALL | CAN BE CUSTOMIZED IN FUTURE
    // const sellAssetQuantity = await getFundHeldAssetQuantity(fund, sellAssetAddress);

    // console.log('sellAssetPrice', sellAssetPrice.toFixed());

    // console.log('held', sellAssetQuantity.toFixed());

    // const buyQuantity = sellAssetQuantity.div(10**18).mul(sellAssetPrice);

    // console.log('buy Quantity', buyQuantity.toFixed());

    // const scheduledTxCallData = fundContract.getCallData(fundContract.instance.makeOrder, {}, [
    //     exchange,
    //     sellAssetAddress,
    //     buyAssetAddress,
    //     sellAssetQuantity,
    //     buyQuantity
    // ]);

    // console.log('scheduled tx call data (fundContract.makeOrder)', scheduledTxCallData);

    // const MELON_CONDITIONAL_ADDRESS = '0xafb8e29e227202973e53ae5f412c79740f387150';

    // const melonConditional = new pApi.newContract(MelonConditionalABI, MELON_CONDITIONAL_ADDRESS);

    // const conditionalCallData = melonConditional.getCallData(melonConditional.instance.check, {}, [
    //     priceFeedAddress,
    //     sellAssetAddress,
    //     priceToTriggerOrder,
    //     '<='
    // ]);

    // console.log('conditional call data', conditionalCallData);

    // const PROXY_WALLET_ADDRESS = '0xb6e014922fc35399994953908f91503c85a28abb';
    // // const proxyWallet = new pApi.newContract(ProxyWalletABI, PROXY_WALLET_ADDRESS);

    // // const serializedScheduledTransaction = w3.utils.asciiToHex(scheduledTxCallData);

    // const transactionScanner = new TransactionScanner();

    // const serializedScheduledTransaction = transactionScanner.serialize(
    //     1,
    //     PROXY_WALLET_ADDRESS,
    //     0,
    //     4500000,
    //     5,
    //     7345109,
    //     9999999,
    //     0,
    //     0,
    //     MELON_CONDITIONAL_ADDRESS,
    //     w3.utils.asciiToHex(scheduledTxCallData),
    //     conditionalCallData
    // );

    // // console.log({
    // //     serializedScheduleTransaction
    // // });

    // const proxyWallet = new w3.eth.Contract(require('./build/contracts/Proxy_Wallet.json').abi, PROXY_WALLET_ADDRESS)

    // const newInstance = await proxyWallet.methods.schedule(serializedScheduledTransaction).send({
    //     from: defaultAccount,
    //     gasLimit: 666666
    // });

    // console.log('proxywallet', newInstance);

    // console

    // proxyWallet.instance.schedule.call({}, [serializedScheduledTransaction]);

    // console.log('after schedule');

main()
  .catch(console.log)