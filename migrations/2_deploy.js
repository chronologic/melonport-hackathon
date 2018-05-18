const ProxyWallet = artifacts.require("./Proxy_Wallet.sol")

const AddressOfChronosScheduler = '0x7a31174fea3deec9ed8ecc899a951705de9a0281'

module.exports = (deployer) => {
    deployer.deploy(ProxyWallet, AddressOfChronosScheduler)
}