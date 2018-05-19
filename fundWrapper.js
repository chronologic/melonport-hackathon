const Web3 = require('web3')
const w3Provider = new Web3.providers.HttpProvider('http://localhost:8545')
const w3 = new Web3(w3Provider)

const MELON_FUND = '0xe9f0237826557e2532aa86fdc1ab0ad0c50f29f7'
const PROXY_WALLET = '0x791f2b5a5b44779dc5950c6fc619ce2d50928cfe'

const ETH_T_ADDR = '0xa27Af8713623fCc239d49108B1A7b187c133e88B'
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

    // allowance(owner, )

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

    const genEnableInvestmentData = (asset) => {
        return melonfund.methods.enableInvestment([
            asset,
        ]).encodeABI()
    }

    const genDisabledInvestmentData = (asset) => {
        return melonfund.methods.disabledInvestment([
            asset,
        ]).encodeABI()
    }

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

    // const melToken = new Asset(MELON_T_ADDR)
    // await melToken.transfer(PROXY_WALLET, 10**20, "0x", {
    //     from: (await w3.eth.getAccounts())[0],
    //     gas: 6000000,
    //     gasPrice: w3.utils.toWei('2', 'shannon'),
    // })

    // console.log(await melToken.balanceOf((await w3.eth.getAccounts())[0]))

    const wEther = new Asset(ETH_T_ADDR)
    // await wEther.transfer(PROXY_WALLET, 10**20, "0x", {
    //     from: (await w3.eth.getAccounts())[0],
    //     gas: 6000000,
    //     gasPrice: w3.utils.toWei('2', 'shannon'),
    // })

    // console.log(await wEther.balanceOf((await w3.eth.getAccounts())[0]))


    // console.log(
        // await sendThruProxy(
        //     melonfund.options.address,
        //     await genEnableInvestmentData(ETH_T_ADDR),
        // )
    // )

    const rez = await melonfund.methods.requestInvestment(
        1000,
        1000,
        ETH_T_ADDR,
    ).send({
        from: (await w3.eth.getAccounts())[0],
        gas: 6000000,
        gasPrice: w3.utils.toWei('2', 'shannon'),
    })

    console.log(rez)

    const lastRequestID = await getLastRequestID()
    console.log(lastRequestID)

    // call approve
    const rez2 = await wEther.approve(melonfund.options.address, 1000000000000000000, {
        from: (await w3.eth.getAccounts())[0],
        gas: 6000000,
        gasPrice: w3.utils.toWei('2', 'shannon'),
    })

    console.log(rez2)


    const result = await melonfund.methods.executeRequest(lastRequestID).send({
        from: (await w3.eth.getAccounts())[0],
        gas: 6000000,
        gasPrice: w3.utils.toWei('2', 'shannon'),
    })

    console.log(result)

    // const executeRequestData = genExecuteRequestData(4)
    // const rez = await sendThruProxy(
    //     melonfund.options.address,
    //     executeRequestData,
    // )

    // console.log(rez)

    // console.log(
    //     await getLastRequestID()
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