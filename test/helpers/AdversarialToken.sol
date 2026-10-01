// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Outlay} from "../../contracts/Outlay.sol";
import {BoolReturnToken} from "../Outlay.t.sol";

// ERC20 boundary double. Modes intentionally model noncanonical tokens and issuer restrictions.
contract AdversarialToken is BoolReturnToken {
    enum ReturnMode {
        True,
        False,
        Empty,
        Malformed,
        Short,
        Revert
    }

    ReturnMode public pullMode;
    ReturnMode public pushMode;
    uint256 public failPush; // 0 = every push; otherwise the selected 1-based leg.
    uint256 public pushes;
    address[] public recipients;
    bool public paused;
    mapping(address => bool) public frozen;
    uint256 public fundingFee;

    Outlay private callbackTarget;
    uint256 private callbackRoom;
    uint256 private otherRoom;
    bool private callbackOnPull;
    bool private callbackArmed;
    uint96 public observedRemaining;
    uint32 public observedSettlements;
    bool public observedActive;
    uint256 public observedRoomCount;
    uint256 public blockedCallbacks;

    function setReturns(ReturnMode pull, ReturnMode push, uint256 leg) external {
        pullMode = pull;
        pushMode = push;
        failPush = leg;
        pushes = 0;
        delete recipients;
    }

    function setPaused(bool value) external {
        paused = value;
    }

    function setFrozen(address account, bool value) external {
        frozen[account] = value;
    }

    function setFundingFee(uint256 fee) external {
        fundingFee = fee;
    }

    function removeBacking(address account, uint256 value) external {
        balanceOf[account] -= value;
    }

    function armCallbacks(Outlay target, uint256 id, uint256 other, bool onPull) external {
        callbackTarget = target;
        callbackRoom = id;
        otherRoom = other;
        callbackOnPull = onPull;
        callbackArmed = true;
        blockedCallbacks = 0;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        _available(from, to);
        uint256 permitted = allowance[from][msg.sender];
        require(permitted >= amount, "allowance");
        allowance[from][msg.sender] = permitted - amount;
        _observeAndAttack(true);
        _transfer(from, to, amount);
        if (fundingFee != 0) balanceOf[to] -= fundingFee;
        return _respond(pullMode);
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        _available(msg.sender, to);
        _observeAndAttack(false);
        _transfer(msg.sender, to, amount);
        recipients.push(to);
        ++pushes;
        return _respond(failPush == 0 || pushes == failPush ? pushMode : ReturnMode.True);
    }

    function _available(address from, address to) private view {
        require(!paused, "token paused");
        require(!frozen[from] && !frozen[to], "token frozen");
    }

    function _observeAndAttack(bool pulling) private {
        if (!callbackArmed || pulling != callbackOnPull) return;
        callbackArmed = false;
        Outlay.Room memory room = callbackTarget.getRoom(callbackRoom);
        observedRemaining = room.remaining;
        observedSettlements = room.settlements;
        observedActive = room.active;
        observedRoomCount = callbackTarget.roomCount();
        bytes[4] memory calls = [
            abi.encodeCall(
                Outlay.openRoom, (address(0xD00D), uint96(1), uint96(1), uint96(2), uint64(1), uint32(0))
            ),
            abi.encodeCall(Outlay.settle, (callbackRoom)),
            abi.encodeCall(Outlay.refund, (callbackRoom)),
            abi.encodeCall(Outlay.settle, (otherRoom))
        ];
        for (uint256 i; i < calls.length; ++i) {
            (bool ok, bytes memory result) = address(callbackTarget).call(calls[i]);
            require(
                !ok && result.length >= 4 && bytes4(result) == Outlay.Reentrant.selector,
                "callback bypassed lock"
            );
            ++blockedCallbacks;
        }
    }

    function _respond(ReturnMode mode) private pure returns (bool) {
        if (mode == ReturnMode.False) return false;
        if (mode == ReturnMode.Revert) revert("token reverted");
        if (mode == ReturnMode.Empty) assembly { return(0, 0) }
        if (mode == ReturnMode.Malformed) {
            assembly {
                mstore(0, 2)
                return(0, 32)
            }
        }
        if (mode == ReturnMode.Short) {
            assembly {
                return(0, 1)
            }
        }
        return true;
    }
}
