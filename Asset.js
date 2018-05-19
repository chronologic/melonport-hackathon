/** Web3 setup */
const Web3 = require('web3')
const w3Provider = new Web3.providers.HttpProvider('http://localhost:8545')
const w3 = new Web3(w3Provider)


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

    allowance(owner, spender) {
        return this.instance.methods.allowance(owner, spender).call()
    }

    transfer(to, value, data, opts) {
        return this.instance.methods.transfer(to, value, data).send(opts)
    }

    getApproveData(spender, value) {
        return this.instance.methods.approve(
            spender,
            value,
        ).encodeABI()
    }
}

module.exports = Asset