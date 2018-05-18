pragma solidity ^0.4.19;

import "../chronos/contracts/Scheduler.sol";

contract Proxy_Wallet {
    mapping(address => bool) whitelist;
    Scheduler scheduler;

    function Proxy_Wallet(address _chronosScheduler) {
        whitelist[msg.sender] = true;
        scheduler = Scheduler(_chronosScheduler);
    }
    
    function addOwner(address _owner) isWhitelisted(msg.sender) {
        whitelist[_owner] = true;
    }

    // function getIndex() returns (uint8) {
    //     return (index % (MAX_WHITELIST-1)) +1;
    // }

    function schedule(bytes _serializedTransaction)
        payable
        isWhitelisted(msg.sender)
    {
        address scheduledTransaction = scheduler.schedule.value(msg.value)(_serializedTransaction);
        //sanity
        require(scheduledTransaction != 0x0);
        whitelist[scheduledTransaction] = true;
    }

    function proxy(
        address _target,
        bytes _callData
    ) isWhitelisted(msg.sender) payable {
        _target.call.value(msg.value)(_callData);
    }

    modifier isWhitelisted(address _test) {
        require(whitelist[_test]);
        _;
    }
}