/** Web3 setup */
const Web3 = require('web3')
const w3Provider = new Web3.providers.HttpProvider('http://localhost:8545')
const w3 = new Web3(w3Provider)

/** Constants */
const ETH_T_ADDR = '0xa27Af8713623fCc239d49108B1A7b187c133e88B'
const MELON_T_ADDR = '0xDC5fC5DaB642f688Bc5BB58bEF6E0d452D7ae123'
const MATCHING_MARKET = '0xe23E971aCCa1Ab30017C5ee01080C56b8335c394'
const PROXY_WALLET_ADDRESS = '0x9968c5625db21bfcd5106f23c7cc174be35b680a';
const MELON_CONDITIONAL_ADDRESS = '0xb78d54d5578f94171afc6cedcd59b1e53d71dbf8';
const MOCK_PRICE_FEED = '0x9f9e3342b8666859625b1a1b90a319e9f7784c2f'

const Asset = require('./Asset')

const TransactionSerializer = require('./TransactionScanner')

const EXECUTION_WINDOW_START = 7346109
const SELL_ASSET_PRICE = 75

const genSerialized = ({
    callGas,
    gasPrice,
    toAddress,
    conditionalCheckAddress,
    conditionalCallData,
    callData,
}) => {
    const txSerializer = new TransactionSerializer()
    const endowment = callGas * gasPrice

    // console.log(
    //     toAddress,
    //     callGas,
    //     gasPrice,
    //     EXECUTION_WINDOW_START,
    //     conditionalCheckAddress,
    //     callData,
    //     conditionalCallData, endowment
    // )

    return {
        data: txSerializer.serialize(
            1,
            toAddress,
            0,
            callGas,
            gasPrice,
            EXECUTION_WINDOW_START,
            9999,
            0,
            0,
            conditionalCheckAddress,
            callData,
            conditionalCallData
        ),
        value: endowment
    }
}

const main = async () => {
    const defaultAccount = (await w3.eth.getAccounts())[0]
    const matchingMarket = new w3.eth.Contract(require('./out/exchange/thirdparty/MatchingMarket.abi.json'), MATCHING_MARKET)

    const melonAsset = new Asset(MELON_T_ADDR)
    const etherAsset = new Asset(ETH_T_ADDR)

    // console.log(
    //     'Balance of Ether Asset: ',
    //     await etherAsset.balanceOf(defaultAccount)
    // )

    // console.log(
    //     'Balance of Melon Asset: ',
    //     await melonAsset.balanceOf(defaultAccount)
    // )

    /** Send opts */
    const opts = {
        from: defaultAccount,
        gas: 6000000,
        gasPrice: w3.utils.toWei('2', 'shannon'),
    }

    const melonConditional = new w3.eth.Contract(
        require('./build/contracts/MelonConditional.json').abi,
        MELON_CONDITIONAL_ADDRESS
    )

    const conditionalCallData = melonConditional.methods.check(
        MOCK_PRICE_FEED,
        ETH_T_ADDR,
        SELL_ASSET_PRICE,
        '<='
    ).encodeABI()

    const makeCallData = matchingMarket.methods.make(
        ETH_T_ADDR, //pay
        MELON_T_ADDR, //buy
        33, //pay amt
        33, //buy amt
    ).encodeABI()

    const proxyWallet = new w3.eth.Contract(require('./build/contracts/Proxy_Wallet.json').abi, PROXY_WALLET_ADDRESS);
    const proxyCallData = await proxyWallet.methods.proxy(
        matchingMarket.options.address, //dest
        makeCallData, //callData
    ).encodeABI()
    
    const { data: serializedScheduledTransaction, value } = genSerialized({
        callGas: 3000000,
        gasPrice: w3.utils.toWei('2', 'shannon'),
        toAddress: PROXY_WALLET_ADDRESS,
        conditionalCheckAddress: MELON_CONDITIONAL_ADDRESS,
        conditionalCallData,
        callData: proxyCallData,
    })

    console.log(serializedScheduledTransaction)
    console.log(value)

    const receipt = await proxyWallet.methods.schedule(
        serializedScheduledTransaction,
    ).send(Object.assign({ value }, opts))

    console.log(receipt)
}

main()
  .catch(console.log)