const ProxyWallet = artifacts.require("./Proxy_Wallet.sol")

const MockPriceFeed = artifacts.require("./MockPriceFeed.sol")
const MelonConditional = artifacts.require("./MelonConditional.sol")

const AddressOfChronosScheduler = '0x7a31174fea3deec9ed8ecc899a951705de9a0281'

module.exports = (deployer) => {
    // deployer.deploy(ProxyWallet, AddressOfChronosScheduler)
    deployer.deploy(MockPriceFeed)
    .then(() => {
        deployer.deploy(MelonConditional)
    })
}