pragma solidity ^0.4.21;

import "./smart-contracts/src/pricefeeds/PriceFeedInterface.sol";

contract MelonConditional {

    string constant GTE = ">=";
    string constant LTE = "<=";

    function extractPrice(
        address _priceFeed,
        address _asset
    ) view returns (uint256) {
        var ( , price, decimal) = PriceFeedInterface(_priceFeed).getPrice(_asset);
        return (price * 10**decimal);
    }

    function check(
        address _priceFeed,
        address _asset,
        uint256 _price,
        string _operator
    ) public view returns (bool) {
        if (keccak256(_operator) == keccak256(GTE)) {
            if (extractPrice(_priceFeed, _asset) >= _price) {
                return true;
            }
        } else if (keccak256(_operator) == keccak256(LTE)) {
            if (extractPrice(_priceFeed, _asset) <= _price) {
                return true;
            }
        } else { return false; }
    }
}