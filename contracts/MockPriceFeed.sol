pragma solidity ^0.4.20;

contract MockPriceFeed {
    uint256 __mockPrice;

    function getPrice(address _asset) view returns (uint256) {
        return __mockPrice;
    }

    function setPrice(uint256 _price) returns (bool) {
        __mockPrice = _price;
    }
}