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
const PriceFeedInterfaceABI = require('./abis/PriceFeedInterface');
const FundABI = require('./abis/FundInterface');
const AssetABI = require('./abis/AssetInterface');
const MelonConditionalABI = require('./abis/MelonConditional');
const ProxyWalletABI = require('./abis/ProxyWallet');
const tokenInfo = require('./smart-contracts/utils/info/tokenInfo');

/** Ether currency symbol */
const etherSymbol = 'Ξ';

/** Constants */
const MELON_T_ADDR = '0xDC5fC5DaB642f688Bc5BB58bEF6E0d452D7ae123'
const ETH_T_ADDR = '0x26bB6da136a71Aa8D62D488BD3C91cC2151F029b'

/** Kovan contracts */
const contracts = {
    "kovan": {
        "Governance": "0x03286b52843541360E84084c1A8e8E6E00c8E95e",
        "CanonicalPriceFeed": "0xb0C791fa9797B31B8aEF784FE2068fDB685bA685",
        "MatchingMarket": "0xEDf27edCB96886F87df95c865De7Fa48f1A76dc8",
        "MatchingMarketAdapter": "0xAebFF6A26FAc6C06dF9e264f0bf96e9614617C88",
        "ZeroExTokenTransferProxy": "0x2A3A66955699f9481E1cE649CeBE335d9B3C1488",
        "ZeroExExchange": "0x55287a08B9f1bE2a1F9A6E8E88377A0f70C4f445",
        "ZeroExV1Adapter": "0x02a6486d0bef92C49552cf90be3F3e92BfFdEbb5",
        "NoCompliance": "0x14fb60c4b832DF80F2C8E5EDC87B2525d3f5f085",
        "OnlyManager": "0x871df91EDad29e23c15C173845B31d60303448D1",
        "RMMakeOrders": "0x68c5613E827a3f8882b92F557CC27Ca0b3c49b52",
        "CentralizedAdapter": "0xCe2a5A17eeBF08Abe606090b517A4cdE2eD18D3a",
        "OnlyManagerCompetition": "0x5f44118CE55bf8b6E6ED75a8beB1d318c6439971",
        "Version": "0x25B0Be6B8Cd2A72A8A1991c4af26E796243cc6fF",
        "FundRanking": "0x0e0EF6257569b428c058317722494f21Df38E1C2",
        "Competition": "0xc3269F7b9FC42492C9A7297d6f86068e510c7093"
    }
}

/** Main */
const main = async () => {
    const defaultAccount = (await pApi.eth.accounts())[0]
    const balance = await pApi.eth.getBalance(defaultAccount)
    console.log(`
Using account: ${defaultAccount}
Account balance: ${balance/10**18}${etherSymbol}`)

    /** Deploy a new Melon fund */
    const opts = {
        from: defaultAccount,
        gas: 3000000,
        gasPrice: pApi.util.toWei('2', 'shannon'), // shannon === gwei... parity prefers the shannon terminology
    }

    /** Deploy the proxy wallet, which will be the fund manager */
    const pWalletAddr = '0xb6e014922fc35399994953908f91503c85a28abb'
    const proxyWallet = new w3.eth.Contract(require('./build/contracts/Proxy_Wallet.json').abi, pWalletAddr)

    /** Construct the call data for deploying a melon fund from the proxy */
    const Fund = new w3.eth.Contract(JSON.parse(fs.readFileSync('./out/Fund.abi')))
    const deployFundOpts = Object.assign(
        {
            data: '0x' + fs.readFileSync('./out/Fund.bin').toString(),
            arguments: [
                pWalletAddr, //ofManager
                'CHRONOS_DEMO_FUND', //withName
                MELON_T_ADDR, //ofQuoteAsset
                0, //ofManagementFee
                0, //ofPerformanceFee
                ETH_T_ADDR, //ofNativeAsset
                '0xea674068083170F668Ce6C496Ac60eD31205d064', //ofCompliance,
                '0x8F014d79ae8a6ac9b245B96dEE107AeFDb636b60', //ofRiskMgmt,
                '0x288A9fB92921472D29ab0b3C3e420a8E4Bd4f452', //ofPriceFee,
                [ //ofExchanges
                    contracts.kovan.MatchingMarket,
                ],
                [ //ofExchangeAdapters
                    contracts.kovan.MatchingMarketAdaptor,
                ]
            ]
        },
         opts,
    )
    const f = await Fund.deploy(
        deployFundOpts,
    ).send(opts)

    // console.log(f)

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
}

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

async function setupStopLoss({ exchange, fund, buyAssetSymbol, priceToTriggerOrder, sellAssetSymbol }) {
    const buyAssetAddress = tokenInfo.kovan.find(token => token.symbol === buyAssetSymbol).address;
    const sellAssetAddress = tokenInfo.kovan.find(token => token.symbol === sellAssetSymbol).address;

    const fundContract = await pApi.newContract(FundABI, fund);

    const priceFeedAddress = await getFundPriceFeedAddress(fundContract);
    const priceFeed = await pApi.newContract(PriceFeedInterfaceABI, priceFeedAddress);

    const sellAssetPrice = await getAssetPrice(priceFeed, sellAssetAddress);

    // SELL ALL | CAN BE CUSTOMIZED IN FUTURE
    const sellAssetQuantity = await getFundHeldAssetQuantity(fund, sellAssetAddress);

    console.log('sellAssetPrice', sellAssetPrice.toFixed());

    console.log('held', sellAssetQuantity.toFixed());

    const buyQuantity = sellAssetQuantity.div(10**18).mul(sellAssetPrice);

    console.log('buy Quantity', buyQuantity.toFixed());

    const scheduledTxCallData = fundContract.getCallData(fundContract.instance.makeOrder, {}, [
        exchange,
        sellAssetAddress,
        buyAssetAddress,
        sellAssetQuantity,
        buyQuantity
    ]);

    console.log('scheduled tx call data (fundContract.makeOrder)', scheduledTxCallData);

    const MELON_CONDITIONAL_ADDRESS = '0xafb8e29e227202973e53ae5f412c79740f387150';

    const melonConditional = new pApi.newContract(MelonConditionalABI, MELON_CONDITIONAL_ADDRESS);

    const conditionalCallData = melonConditional.getCallData(melonConditional.instance.check, {}, [
        priceFeedAddress,
        sellAssetAddress,
        priceToTriggerOrder,
        '<='
    ]);

    console.log('conditional call data', conditionalCallData);

    const PROXY_WALLET_ADDRESS = '0xb6e014922fc35399994953908f91503c85a28abb';
    const proxyWallet = new pApi.newContract(ProxyWalletABI, PROXY_WALLET_ADDRESS);
}

main()
  .catch(console.log)