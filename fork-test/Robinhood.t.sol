// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Outlay} from "../contracts/Outlay.sol";
import {AuditVm} from "../test/helpers/OutlayFixture.sol";

interface CanonicalUSDG {
    function decimals() external view returns (uint8);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function paused() external view returns (bool);
    function isFrozen(address account) external view returns (bool);
    function defaultAdmin() external view returns (address);
    function grantRole(bytes32 role, address account) external;
    function pause() external;
    function unpause() external;
    function freeze(address account) external;
    function unfreeze(address account) external;
}

// Runs only with FOUNDRY_PROFILE=robinhood and an explicit public RPC fork.
// All deployments, impersonation, issuer actions and transfers exist only in Forge's local EVM.
contract RobinhoodUSDGForkTest {
    AuditVm private constant vm = AuditVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address private constant USDG = 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168;
    address private constant PUBLISHED = 0xe1B5d2cF63C43103455ABD802B6B241b959a530c;
    address private constant SENDER = 0xEE3eA6f858aE84dD6959f241DfC257a2f8fA3f53;
    address private constant PAYEE = address(0xB0B);
    address private constant CALLER = address(0xCA11E2);
    CanonicalUSDG private constant token = CanonicalUSDG(USDG);
    Outlay private local;

    function setUp() public {
        require(block.chainid == 4663, "explicit Robinhood RPC fork required");
        require(token.decimals() == 6, "canonical USDG decimals changed");
        require(!token.paused() && !token.isFrozen(SENDER), "snapshot transfer restrictions changed");
        require(token.balanceOf(SENDER) >= 220_000, "published sender no longer has fixture funding");
        local = new Outlay(USDG);
    }

    function testPublishedClosedRoomAndRuntimeRemainUnchanged() public view {
        require(
            PUBLISHED.codehash == 0x85a19056971ff2d270e7a32ee7ac27a47eb5969331914e6dd46f67206b732ee9,
            "published runtime changed"
        );
        Outlay deployed = Outlay(PUBLISHED);
        require(deployed.usdg() == USDG, "published token changed");
        Outlay.Room memory room = deployed.getRoom(1);
        require(
            room.amount == 100_000 && room.bounty == 10_000 && room.remaining == 0 && room.settlements == 1
                && room.interval == 0 && !room.active,
            "published room changed"
        );
        require(token.balanceOf(PUBLISHED) == 0, "published closed room has a token balance");
    }

    function testCanonicalTransferChangesBothBalancesByExactRequestedValue() public {
        uint256 senderBefore = token.balanceOf(SENDER);
        uint256 payeeBefore = token.balanceOf(PAYEE);
        vm.prank(SENDER);
        require(token.transfer(PAYEE, 50_000), "canonical transfer failed");
        require(token.balanceOf(SENDER) == senderBefore - 50_000, "canonical sender transfer delta");
        require(token.balanceOf(PAYEE) == payeeBefore + 50_000, "canonical recipient transfer delta");
    }

    function testCanonicalFundingPayoutBountyAndLeftoverAreUnitTransfers() public {
        uint256 senderBefore = token.balanceOf(SENDER);
        uint256 payeeBefore = token.balanceOf(PAYEE);
        uint256 callerBefore = token.balanceOf(CALLER);
        uint256 id = _open(PAYEE, 150_000);
        require(token.balanceOf(address(local)) == 150_000, "canonical funding shortfall");
        vm.prank(CALLER);
        local.settle(id);
        require(token.balanceOf(SENDER) == senderBefore - 110_000, "canonical sender net cost");
        require(token.balanceOf(PAYEE) == payeeBefore + 100_000, "canonical payout delta");
        require(token.balanceOf(CALLER) == callerBefore + 10_000, "canonical bounty delta");
        require(token.balanceOf(address(local)) == 0, "canonical leftover not returned");
    }

    function testCanonicalRefundReturnsFullFunding() public {
        uint256 before = token.balanceOf(SENDER);
        uint256 id = _open(PAYEE, 220_000);
        vm.prank(SENDER);
        local.refund(id);
        require(token.balanceOf(SENDER) == before, "canonical full refund delta");
        require(token.balanceOf(address(local)) == 0 && !local.getRoom(id).active, "canonical refund state");
    }

    function testCanonicalSelfPayeeStrandsPayoutAsDisclosed() public {
        uint256 id = _open(address(local), 110_000);
        vm.prank(CALLER);
        local.settle(id);
        require(token.balanceOf(address(local)) == 100_000, "canonical self-payee characterization");
        require(!local.getRoom(id).active && local.getRoom(id).remaining == 0, "canonical self-payee state");
    }

    function testCanonicalBalanceDoesNotAutomaticallyRebaseAcrossTimeWarp() public {
        uint256 before = token.balanceOf(SENDER);
        vm.warp(block.timestamp + 30 days);
        require(token.balanceOf(SENDER) == before, "canonical stored balance changed with time");
    }

    function testIssuerPauseBlocksSettleAndRefundAtomicallyUntilUnpaused() public {
        uint256 id = _open(PAYEE, 110_000);
        bytes32 before = keccak256(abi.encode(local.getRoom(id)));
        _grantLocalIssuerRole(keccak256("PAUSE_ROLE"));
        token.pause();
        require(token.paused(), "local canonical pause not applied");
        vm.expectRevert(Outlay.TransferFailed.selector);
        vm.prank(CALLER);
        local.settle(id);
        vm.expectRevert(Outlay.TransferFailed.selector);
        vm.prank(SENDER);
        local.refund(id);
        require(keccak256(abi.encode(local.getRoom(id))) == before, "canonical pause changed accounting");
        token.unpause();
        vm.prank(CALLER);
        local.settle(id);
        require(!local.getRoom(id).active, "canonical unpause did not restore settlement");
    }

    function testIssuerFreezeOutlayBlocksWithdrawalsUntilUnfrozen() public {
        uint256 id = _open(PAYEE, 110_000);
        bytes32 before = keccak256(abi.encode(local.getRoom(id)));
        _grantLocalIssuerRole(keccak256("ASSET_PROTECTION_ROLE"));
        token.freeze(address(local));
        require(token.isFrozen(address(local)), "local canonical freeze not applied");
        vm.expectRevert(Outlay.TransferFailed.selector);
        vm.prank(CALLER);
        local.settle(id);
        vm.expectRevert(Outlay.TransferFailed.selector);
        vm.prank(SENDER);
        local.refund(id);
        require(keccak256(abi.encode(local.getRoom(id))) == before, "canonical freeze changed accounting");
        token.unfreeze(address(local));
        vm.prank(SENDER);
        local.refund(id);
        require(!local.getRoom(id).active, "canonical unfreeze did not restore refund");
    }

    function testCanonicalFrozenPayeeBlocksPaymentButAllowsUnpaidRefund() public {
        uint256 id = _open(PAYEE, 110_000);
        _grantLocalIssuerRole(keccak256("ASSET_PROTECTION_ROLE"));
        token.freeze(PAYEE);
        require(token.isFrozen(PAYEE), "canonical payee freeze");
        vm.expectRevert(Outlay.TransferFailed.selector);
        vm.prank(CALLER);
        local.settle(id);
        require(local.getRoom(id).settlements == 0, "canonical freeze counted a payment");
        vm.prank(SENDER);
        local.refund(id);
        require(!local.getRoom(id).active, "canonical frozen-payee refund");
    }

    function testCanonicalFrozenCallerRollsBackEarlierPayeeTransfer() public {
        uint256 id = _open(PAYEE, 110_000);
        uint256 before = token.balanceOf(PAYEE);
        _grantLocalIssuerRole(keccak256("ASSET_PROTECTION_ROLE"));
        token.freeze(CALLER);
        require(token.isFrozen(CALLER), "canonical caller freeze");
        vm.expectRevert(Outlay.TransferFailed.selector);
        vm.prank(CALLER);
        local.settle(id);
        require(token.balanceOf(PAYEE) == before, "canonical freeze left a partial payout");
        require(
            local.getRoom(id).remaining == 110_000 && local.getRoom(id).settlements == 0,
            "canonical frozen caller changed room"
        );
    }

    function _open(address payee, uint96 funded) private returns (uint256 id) {
        vm.startPrank(SENDER);
        require(token.approve(address(local), funded), "canonical exact approval failed");
        id = local.openRoom(payee, 100_000, 10_000, funded, 1, 0);
        vm.stopPrank();
    }

    function _grantLocalIssuerRole(bytes32 role) private {
        // Impersonation exists only on the local fork; no issuer key or RPC write is involved.
        vm.prank(token.defaultAdmin());
        token.grantRole(role, address(this));
    }
}
