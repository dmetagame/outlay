// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Outlay} from "../../contracts/Outlay.sol";
import {BoolReturnToken} from "../Outlay.t.sol";

interface AuditVm {
    function expectRevert() external;
    function expectRevert(bytes4 selector) external;
    function expectRevert(bytes calldata data) external;
    function prank(address sender) external;
    function startPrank(address sender) external;
    function stopPrank() external;
    function warp(uint256 timestamp) external;
    function load(address target, bytes32 slot) external view returns (bytes32);
    function store(address target, bytes32 slot, bytes32 value) external;
}

abstract contract OutlayFixture {
    AuditVm internal constant vm = AuditVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address internal constant SENDER = address(0xA11CE);
    address internal constant PAYEE = address(0xB0B);
    address internal constant SETTLER = address(0xCA11E2);
    uint96 internal constant PAYOUT = 100_000;
    uint96 internal constant BOUNTY = 10_000;
    uint96 internal constant COST = 110_000;

    BoolReturnToken internal token;
    Outlay internal outlay;

    function setUp() public virtual {
        token = new BoolReturnToken();
        outlay = new Outlay(address(token));
        _fund(token, outlay, 10_000_000);
        vm.warp(100);
    }

    function _fund(BoolReturnToken asset, Outlay target, uint256 value) internal {
        asset.mint(SENDER, value);
        vm.prank(SENDER);
        asset.approve(address(target), value);
    }

    function _open(uint96 funded, uint64 dueAt, uint32 interval) internal returns (uint256) {
        vm.prank(SENDER);
        return outlay.openRoom(PAYEE, PAYOUT, BOUNTY, funded, dueAt, interval);
    }

    function _settle(uint256 id) internal {
        vm.prank(SETTLER);
        outlay.settle(id);
    }

    function _sameRoom(Outlay.Room memory actual, Outlay.Room memory expected) internal pure {
        require(keccak256(abi.encode(actual)) == keccak256(abi.encode(expected)), "room changed on failure");
    }

    function _eq(uint256 actual, uint256 expected, string memory reason) internal pure {
        require(actual == expected, reason);
    }
}
