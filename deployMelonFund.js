const parityApi = require('@parity/api')
const PriceFeedInterfaceABI = require('./abis/PriceFeedInterface');
const FundInterfaceABI = require('./abis/FundInterface');
const tokenInfo = require('./smart-contracts/utils/info/tokenInfo');

const PARITY_PROVIDER = 'http://localhost:8545';//'https://rarely-suitable-shark.quiknode.io/87817da9-942d-4275-98c0-4176eee51e1a/aB5gwSfQdN4jmkS65F1HyA==/'//'https://kovan.infura.io/6M6ROam68gmdp9OeNmy'; //

/** Parity provider set up */
const provider = new parityApi.Provider.Http(PARITY_PROVIDER);
const pApi = new parityApi(provider);

/** Ether currency symbol */
const etherSymbol = 'Ξ';

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

    const TEST_FUND_ADDRESS = '0x3BeBf94Ab7e9Da434137EFb8226eA8d50AA97389';

    const fundContract = await pApi.newContract(FundInterfaceABI, TEST_FUND_ADDRESS);

    const ETHER_TOKEN_SYMBOL = 'ETH-T-M';

    const MELON_TOKEN_SYMBOL = 'MLN-T-M';

    const TOKEN_SYMBOL = ETHER_TOKEN_SYMBOL;

    const realPriceFeedAddress = (await fundContract.instance.getModules.call())[0];

    console.log(realPriceFeedAddress, 'realprice');

    const priceFeed = await pApi.newContract(PriceFeedInterfaceABI, realPriceFeedAddress);

    const assetAddress = tokenInfo.kovan.find(token => token.symbol === TOKEN_SYMBOL).address;

    console.log('asset address', assetAddress);

    const [isRecent, price, decimal] = await priceFeed.instance.getPrice.call({}, [assetAddress]);

    console.log('priceFeedPrice', price.toFixed());

    const STOP_LOSS_PRICE_SELL = '';

    // asset address, conditional melon address,
}

main()
  .catch(console.log)