pragma solidity ^0.4.19;

import "../chronos/contracts/Scheduler.sol";

contract Proxy_Wallet {
    uint8 constant MAX_WHITELIST = 5;

    address[] whitelist;
    uint8 index;
    Scheduler scheduler;

    function Proxy_Wallet(address _chronosScheduler) {
        whitelist.push(msg.sender);
        scheduler = Scheduler(_chronosScheduler);
    }

    function getIndex() returns (uint8) {
        return (index % (MAX_WHITELIST-1)) +1;
    }

    function schedule(bytes _serializedTransaction)
        isWhitelisted
    {
        address scheduledTransaction = scheduler.schedule(_serializedTransaction);
        //sanity
        require(scheduledTransaction != 0x0);
        index++;
        uint8 idx = getIndex();
        whitelist[idx] = scheduledTransaction;
    }

    function proxy(
        address _target,
        address _callData
    ) isWhitelisted payable {
        _target.call.value(msg.value)(_callData);
    }

    modifier isWhitelisted() {
        bool found = false;
        for (var i = 0; i <= MAX_WHITELIST; i++) {
            if (msg.sender == whitelist[i]) {
                found = true;
            }
        }
        require(found);
        _;
    }
}