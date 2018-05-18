const MockPriceFeed = artifacts.require('MockPriceFeed.sol')
const MelonConditional = artifacts.require('MelonConditional.sol')

const randomAddress = "0x082D23A8bef5767662fA45F05aB77E7aF13feFeA"

contract('MelonConditional', () => {
    it('the mock price feed works', async () => {
        const mpf = await MockPriceFeed.new()
        const mc = await MelonConditional.new()
        
        await mpf.setPrice(1200)
        console.log(
            await mpf.getPrice(randomAddress)
        )

        console.log(
            await mc.check(
                mpf.address,
                randomAddress,
                600,
                "<="
            )
        )

        console.log(
            await mc.check(
                mpf.address,
                randomAddress,
                750,
                ">="
            )
        )
    })
})