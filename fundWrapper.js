const Web3 = require('web3')
const w3Provider = new Web3.providers.HttpProvider('http://localhost:8545')
const w3 = new Web3(w3Provider)

const MELON_FUND = '0xe9f0237826557e2532aa86fdc1ab0ad0c50f29f7'
const PROXY_WALLET = '0x9968c5625db21bfcd5106f23c7cc174be35b680a'

const MELON_T_ADDR = '0xDC5fC5DaB642f688Bc5BB58bEF6E0d452D7ae123'

const testAddr = "0x082D23A8bef5767662fA45F05aB77E7aF13feFeA"

class Asset {
    constructor(address) {
        this.address = address
        this.instance = new w3.eth.Contract(require('./out/Asset.abi.json'), address)
    }

    balanceOf(address) {
        return this.instance.methods.balanceOf(address).call()
    }

    approve(spender, value, opts) {
        return this.instance.methods.approve(spender, value).send(opts)
    }

    transfer(to, value, data, opts) {
        return this.instance.methods.transfer(to, value, data).send(opts)
    }
}

const main = async () => {
    const proxyWallet = new w3.eth.Contract(require('./build/contracts/Proxy_Wallet.json').abi, PROXY_WALLET)
    const melonfund = new w3.eth.Contract(require('./out/Fund.abi.json'), MELON_FUND)

    const sendThruProxy = async (dest, encoded, v) => {
        const opts = {
            from: (await w3.eth.getAccounts())[0],
            gas: 6000000,
            gasPrice: w3.utils.toWei('2', 'shannon'),
            value: v ? v : 0, 
        }
        // console.log(dest, encoded)

        try {
            const res = await proxyWallet.methods.proxy(
                dest,
                encoded,
            ).send(opts)

            return res

        } catch (err) {
            throw new Error(err)
        }
    }

    const disableInvestmentData = melonfund.methods.disableInvestment([
        testAddr,
    ]).encodeABI()
    const enableInvestmentData = melonfund.methods.enableInvestment([
        testAddr,
    ]).encodeABI()

    const genRequestInvestmentData = (
        giveQuant,
        shareQuant,
        investmentAsset
    ) => {
        return melonfund.methods.requestInvestment(
            giveQuant,
            shareQuant,
            investmentAsset
        ).encodeABI()
    }

    const genExecuteRequestData = (id) => {
        return melonfund.methods.executeRequest(id).encodeABI()
    }

    const getLastRequestID = () => {
        return melonfund.methods.getLastRequestId().call()
    }

    const melToken = new Asset(MELON_T_ADDR)
    await melToken.transfer(PROXY_WALLET, 12, "0x", {
        from: (await w3.eth.getAccounts())[0],
        gas: 6000000,
        gasPrice: w3.utils.toWei('2', 'shannon'),
    })

    console.log(await melToken.balanceOf((await w3.eth.getAccounts())[0]))


    // console.log(
    //     await sendThruProxy(
    //         melonfund.options.address,
    //         enableInvestmentData,
    //     )
    // )

    // console.log(await melonfund.methods.isInvestAllowed(testAddr).call())

    // await sendThruProxy(
    //     melonfund.options.address,
    //     disableInvestmentData,
    // )

    // console.log(await melonfund.methods.isInvestAllowed(testAddr).call())
    // console.log(await melonfund.methods.owner().call())
}

main()
  .catch(console.log)