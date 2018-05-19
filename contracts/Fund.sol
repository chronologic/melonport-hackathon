pragma solidity ^0.4.19;

contract ERC20 {
  function allowance(address owner, address spender)
    public view returns (uint256);

  function transferFrom(address from, address to, uint256 value)
    public returns (bool);

  function approve(address spender, uint256 value) public returns (bool);
  event Approval(
    address indexed owner,
    address indexed spender,
    uint256 value
  );
}

interface MatchingMarket {
    function make(
        address    pay_gem,
        address    buy_gem,
        uint128  pay_amt,
        uint128  buy_amt
    ) external returns (bytes32 id);
}

contract Fund {
    function makeOrder(
        uint256 exchangeNumber,
        ERC20 sellAsset,
        ERC20 buyAsset,
        uint128 sellQuantity,
        uint128 buyQuantity
    ) public {
        MatchingMarket market = MatchingMarket(0xe23E971aCCa1Ab30017C5ee01080C56b8335c394);

        sellAsset.approve(market, sellQuantity);

        market.make(
            sellAsset,
            buyAsset,
            sellQuantity,
            buyQuantity
        );
    }
}
