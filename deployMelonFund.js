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

/** Ether currency symbol */
const etherSymbol = 'Ξ';

/** Constants */
const ETH_T_ADDR = '0xa27Af8713623fCc239d49108B1A7b187c133e88B'

/** Kovan contracts */
const kovan = require('./addressBook.json').kovan;

/** Main */
const main = async () => {
    const defaultAccount = (await pApi.eth.accounts())[1];
    const balance = await pApi.eth.getBalance(defaultAccount);
    console.log(`
Using account: ${defaultAccount}
Account balance: ${balance/10**18}${etherSymbol}`);

    /** Deploy a new Melon fund */
    const opts = {
        from: defaultAccount,
        gas: 7000000,
        gasPrice: pApi.util.toWei('2', 'shannon'), // shannon === gwei... parity prefers the shannon terminology
    };

    /** Deploy the proxy wallet, which will be the fund manager */
    const pWalletAddr = '0x9968c5625db21bfcd5106f23c7cc174be35b680a'
    const proxyWallet = new w3.eth.Contract(require('./build/contracts/Proxy_Wallet.json').abi, pWalletAddr)

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

    // const f = await Fund.deploy(
    //     deployFundOpts,
    // ).send(opts)

    // console.log(f)

    // const tx2 = await proxyWallet.methods.addOwner('0x7aC965bFAF11a989E93E1B9381fE460C7819999a').send(opts)
    // console.log(tx2)

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
}

main()
  .catch(console.log);