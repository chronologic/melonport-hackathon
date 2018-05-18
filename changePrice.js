/** Utility to change the price of the MockPriceFeed contract
 * Address of MockPriceFeed - `0x9f9e3342b8666859625b1a1b90a319e9f7784c2f`
 */

const Web3 = require('web3')
const w3Provider = new Web3.providers.HttpProvider('http://localhost:8545')
const w3 = new Web3(w3Provider)

const MOCK_PRICE_FEED = '0x9f9e3342b8666859625b1a1b90a319e9f7784c2f'

const main = async () => {
    const mpf = new w3.eth.Contract(require('./build/contracts/MockPriceFeed.json').abi, MOCK_PRICE_FEED)
    if (process.argv.len < 3) {
        throw new Error('Usage: node changePrice.js <targetPrice>')
    }
    const targetPrice = process.argv[2]

    const defaultAccount = (await w3.eth.getAccounts())[0]
    const opts = {
        from: defaultAccount,
        gas: 7000000,
        gasPrice: w3.utils.toWei('2', 'shannon')
    }

    mpf.methods.setPrice(targetPrice).send(opts)
      .then(res => {
          if (res.status === true) {
              console.log('success!')
              console.log('new price of feed: ' + targetPrice)
              console.log('transaction hash: ' + res.transactionHash)
          }
      })
}

main()
  .catch(console.log)