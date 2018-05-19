pragma solidity ^0.4.20;

contract MockPriceFeed {
    uint256 __mockPrice;

    function getPrice(address ofAsset) public view returns (bool isRecent, uint256 price, uint decimal)
    {
        return (
            true,
            __mockPrice,
            18
        );
    }

    function setPrice(uint256 _price) public returns (bool) {
        __mockPrice = _price;
    }
}