const fs = require('fs')

const parityApi = require('@parity/api')

/** Parity provider set up */
const provider = new parityApi.Provider.Http('http://localhost:8545')
const pApi = new parityApi(provider)

/** Ether currency symbol */
const etherSymbol = 'Ξ'

/** Kovan contracts */
const contracts = {
    "kovan": {
        "Governance": "0x03286b52843541360E84084c1A8e8E6E00c8E95e",
        "CanonicalPriceFeed": "0xb0C791fa9797B31B8aEF784FE2068fDB685bA685",
        "MatchingMarket": "0xEDf27edCB96886F87df95c865De7Fa48f1A76dc8",
        "MatchingMarketAdapter": "0xAebFF6A26FAc6C06dF9e264f0bf96e9614617C88",
        "ZeroExTokenTransferProxy": "0x2A3A66955699f9481E1cE649CeBE335d9B3C1488",
        "ZeroExExchange": "0x55287a08B9f1bE2a1F9A6E8E88377A0f70C4f445",
        "ZeroExV1Adapter": "0x02a6486d0bef92C49552cf90be3F3e92BfFdEbb5",
        "NoCompliance": "0x14fb60c4b832DF80F2C8E5EDC87B2525d3f5f085",
        "OnlyManager": "0x871df91EDad29e23c15C173845B31d60303448D1",
        "RMMakeOrders": "0x68c5613E827a3f8882b92F557CC27Ca0b3c49b52",
        "CentralizedAdapter": "0xCe2a5A17eeBF08Abe606090b517A4cdE2eD18D3a",
        "OnlyManagerCompetition": "0x5f44118CE55bf8b6E6ED75a8beB1d318c6439971",
        "Version": "0x25B0Be6B8Cd2A72A8A1991c4af26E796243cc6fF",
        "FundRanking": "0x0e0EF6257569b428c058317722494f21Df38E1C2",
        "Competition": "0xc3269F7b9FC42492C9A7297d6f86068e510c7093"
    }
}

/** Main */
const main = async () => {
    const defaultAccount = (await pApi.eth.accounts())[0]
    const balance = await pApi.eth.getBalance(defaultAccount)
    console.log(`
Using account: ${defaultAccount}
Account balance: ${balance/10**18}${etherSymbol}`)

    /** Deploy a new Melon fund */
    const opts = {
        from: defaultAccount,
        gas: 4500000,
        gasPrice: pApi.util.toWei('2', 'shannon'), // shannon === gwei... parity prefers the shannon terminology
    }

    /** Deploy the proxy wallet, which will be the fund manager */
    const Proxy_Wallet_ABI = fs.readFileSync('./tmp/Proxy_Wallet.abi')
    const Proxy_Wallet_Bytecode = fs.readFileSync('./tmp/Proxy_Wallet.bin')

    // console.log(pApi)
    console.log(JSON.parse(Proxy_Wallet_ABI.toString()))
    const c = pApi.newContract(pApi.eth, JSON.parse(Proxy_Wallet_ABI.toString()))
    // console.log(c)
    // const c2 = await c.deploy('0x0e0EF6257569b428c058317722494f21Df38E1C2')
    // console.log(c2)
}

main()
  .catch(console.log)