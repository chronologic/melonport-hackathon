/** Web3 setup */
const Web3 = require('web3')
const w3Provider = new Web3.providers.HttpProvider('http://localhost:8545')
const w3 = new Web3(w3Provider)

/** Constants */
const ETH_T_ADDR = '0xa27Af8713623fCc239d49108B1A7b187c133e88B'
const MELON_T_ADDR = '0xDC5fC5DaB642f688Bc5BB58bEF6E0d452D7ae123'
const MATCHING_MARKET = '0xe23E971aCCa1Ab30017C5ee01080C56b8335c394'

const Asset = require('./Asset')

class MatchingMarket {
    constructor(addr) {
        this.address = addr
        this.instance = new w3.eth.Contract(
            require('./out/exchange/thirdparty/MatchingMarket.abi.json'), 
            addr,
        )
    }

    lastOfferID() {
        return this.instance.methods.last_offer_id().call()
    }

    getOffer(id) {
        return this.instance.methods.getOffer(id).call()
    }

    getOwner(id) {
        return this.instance.methods.getOwner(id).call()
    }

    buy(id, quant, opts) {
        return this.instance.methods.buy(id, quant).send(opts)
    }
}

module.exports = () => {
    return new MatchingMarket(MATCHING_MARKET)
}

// const main = async () => {
//     const matchingMarket = new w3.eth.Contract(require('./out/exchange/thirdparty/MatchingMarket.abi.json'), MATCHING_MARKET)

//     const defaultAccount = (await w3.eth.getAccounts())[0]

//     const melonAsset = new Asset(MELON_T_ADDR)
//     const etherAsset = new Asset(ETH_T_ADDR)

//     console.log(
//         'Balance of Ether Asset: ',
//         await etherAsset.balanceOf(defaultAccount)
//     )

//     console.log(
//         'Balance of Melon Asset: ',
//         await melonAsset.balanceOf(defaultAccount)
//     )

//     /** Send opts */
//     const opts = {
//         from: defaultAccount,
//         gas: 6000000,
//         gasPrice: w3.utils.toWei('2', 'shannon'),
//     }

    /** Send Tokens */
    // const sendTokens = async (dest, amts) => {
    //     const [amt1, amt2] = amts
    //     console.log('Sending Tokens..')
    //     const t1 = await melonAsset.transfer(dest, amt1, "0x", opts)
    //     if (t1.status === true) {
    //         console.log('Success! Melon Asset sent!')
    //     }
    //     const t2 = await etherAsset.transfer(dest,amt2,"0x", opts)
    //     if (t2.status === true) {
    //         console.log('Success! Ether Asset sent!')
    //     }
    // }

    // sendTokens('0x7aC965bFAF11a989E93E1B9381fE460C7819999a', [2 * 10**16, 2 * 10**16])

    /** Make an order */
    // console.log('\nApproval..')
    // const tx1 = await etherAsset.approve(matchingMarket.options.address, 1 * 10**18, opts)
    // if (tx1.status === true) {
    //     console.log('Success! Ether Asset approved.')
    // }
    // const tx2 = await melonAsset.approve(matchingMarket.options.address, 1 * 10**18, opts)
    // if (tx2.status === true) {
    //     console.log('Success! Melon Asset approved.')
    // }

    // console.log(
    //     await matchingMarket.methods.make(
    //         ETH_T_ADDR,
    //         MELON_T_ADDR,
    //         20,
    //         20
    //     ).send(opts)
    // )

    /** Take an order */

// }

// main()
//   .catch(console.log)
