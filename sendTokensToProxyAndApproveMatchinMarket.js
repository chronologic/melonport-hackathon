/** Web3 setup */
const Web3 = require('web3')
const w3Provider = new Web3.providers.HttpProvider('http://localhost:8545')
const w3 = new Web3(w3Provider)

/** Constants */
const ETH_T_ADDR = '0xa27Af8713623fCc239d49108B1A7b187c133e88B'
const MELON_T_ADDR = '0xDC5fC5DaB642f688Bc5BB58bEF6E0d452D7ae123'
const MATCHING_MARKET = '0xe23E971aCCa1Ab30017C5ee01080C56b8335c394'
const PROXY_WALLET_ADDRESS = '0x9968c5625db21bfcd5106f23c7cc174be35b680a';

const Asset = require('./Asset')

const main = async () => {
    const matchingMarket = new w3.eth.Contract(require('./out/exchange/thirdparty/MatchingMarket.abi.json'), MATCHING_MARKET)

    const defaultAccount = (await w3.eth.getAccounts())[0]

    const melonAsset = new Asset(MELON_T_ADDR)
    const etherAsset = new Asset(ETH_T_ADDR)

    console.log(
        'Balance of Ether Asset: ',
        await etherAsset.balanceOf(defaultAccount)
    )

    console.log(
        'Balance of Melon Asset: ',
        await melonAsset.balanceOf(defaultAccount)
    )

    /** Send opts */
    const opts = {
        from: defaultAccount,
        gas: 6000000,
        gasPrice: w3.utils.toWei('2', 'shannon'),
    }


    /** Send Tokens */
    const sendTokens = async (dest, amts) => {
        const [amt1, amt2] = amts
        console.log('Sending Tokens..')
        const t1 = await melonAsset.transfer(dest, amt1, "0x", opts)
        if (t1.status === true) {
            console.log('Success! Melon Asset sent!')
        }
        const t2 = await etherAsset.transfer(dest,amt2,"0x", opts)
        if (t2.status === true) {
            console.log('Success! Ether Asset sent!')
        }
    }

    await sendTokens(PROXY_WALLET_ADDRESS, [2 * 10**16, 2 * 10**16])

    /**Approval */
    console.log('Calling approve of Proxy -> ETH-T..')
    const proxyWallet = new w3.eth.Contract(require('./build/contracts/Proxy_Wallet.json').abi, PROXY_WALLET_ADDRESS);

    const data = etherAsset.getApproveData(MATCHING_MARKET, 1 *10**16)

    const receipt = await proxyWallet.methods.proxy(
        ETH_T_ADDR,
        data
    ).send(opts)
    if (receipt.status === true) {
        console.log('Success! Approved Matching Market to transfer Ether Asset from Proxy Wallet')
        console.log('Check it on etherscan: ' + receipt.transactionHash)
    }
}


main()
  .catch(console.error)