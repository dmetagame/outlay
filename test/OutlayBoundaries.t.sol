// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Outlay} from "../contracts/Outlay.sol";
import {OutlayFixture} from "./helpers/OutlayFixture.sol";
import {NoReturnToken} from "./Outlay.t.sol";

contract OutlayBoundariesTest is OutlayFixture {
    function testCostOfRejectsZeroAndOverflow() public {
        vm.expectRevert(Outlay.BadArgs.selector);
        outlay.costOf(0, 1);
        vm.expectRevert(Outlay.BadArgs.selector);
        outlay.costOf(1, 0);
        vm.expectRevert(Outlay.BadArgs.selector);
        outlay.costOf(type(uint96).max, 1);
        vm.expectRevert(Outlay.BadArgs.selector);
        outlay.costOf(type(uint96).max, type(uint96).max);
        _eq(outlay.costOf(type(uint96).max - 1, 1), type(uint96).max, "maximum cost");
    }

    function testOpenRejectsOverflowWithoutPullingTokens() public {
        vm.expectRevert(Outlay.BadArgs.selector);
        vm.prank(SENDER);
        outlay.openRoom(PAYEE, type(uint96).max, 1, type(uint96).max, 1, 0);
        _eq(outlay.roomCount(), 0, "invalid room created");
        _eq(token.balanceOf(SENDER), 10_000_000, "invalid funding pulled");
    }

    function testMaximumCostCanOpenAndSettleWithoutTruncation() public {
        uint96 maximum = type(uint96).max;
        _fund(token, outlay, maximum);
        vm.prank(SENDER);
        uint256 id = outlay.openRoom(PAYEE, maximum - 1, 1, maximum, 1, 0);
        _eq(outlay.getRoom(id).remaining, maximum, "funding truncated");
        _settle(id);
        _eq(token.balanceOf(PAYEE), maximum - 1, "payout truncated");
        _eq(token.balanceOf(SETTLER), 1, "bounty wrong");
        _eq(token.balanceOf(address(outlay)), 0, "maximum room not cleared");
    }

    function testZeroPayeeAndZeroDueAreRejected() public {
        vm.expectRevert(Outlay.BadArgs.selector);
        vm.prank(SENDER);
        outlay.openRoom(address(0), PAYOUT, BOUNTY, COST, 1, 0);
        vm.expectRevert(Outlay.BadArgs.selector);
        vm.prank(SENDER);
        outlay.openRoom(PAYEE, PAYOUT, BOUNTY, COST, 0, 0);
        _eq(outlay.roomCount(), 0, "bad args created a room");
    }

    function testPayeeCanSettleAndReceivesBothPaymentLegs() public {
        uint256 id = _open(COST, 1, 0);
        vm.prank(PAYEE);
        outlay.settle(id);
        _eq(token.balanceOf(PAYEE), 110_000, "payee caller did not receive both legs");
        _eq(token.balanceOf(address(outlay)), 0, "room not depleted");
    }

    // Characterization of F3, not an assertion that self-payment is safe.
    // The website prevents this configuration; direct contract callers can still choose it.
    function testDirectSelfPayeeLeavesUnallocatedPayout() public {
        vm.prank(SENDER);
        uint256 id = outlay.openRoom(address(outlay), PAYOUT, BOUNTY, COST, 1, 0);
        _settle(id);
        require(!outlay.getRoom(id).active, "self-payee room not closed");
        _eq(outlay.getRoom(id).remaining, 0, "self-payee room accounting");
        _eq(token.balanceOf(address(outlay)), 100_000, "unallocated payout not reproduced");
        vm.expectRevert(Outlay.AlreadyPaid.selector);
        vm.prank(SENDER);
        outlay.refund(id);
    }

    function testOneShotCannotSettleTwice() public {
        uint256 id = _open(COST * 2, 1, 0);
        _settle(id);
        vm.expectRevert(Outlay.Inactive.selector);
        _settle(id);
        _eq(token.balanceOf(PAYEE), 100_000, "one-shot paid twice");
        _eq(outlay.getRoom(id).settlements, 1, "one-shot count");
    }

    function testRecurringSecondSettlementSucceedsExactlyAtNewDueTime() public {
        uint256 id = _open(COST * 2, 90, 60);
        vm.warp(145);
        _settle(id);
        vm.warp(204);
        vm.expectRevert(Outlay.NotDue.selector);
        _settle(id);
        vm.warp(205);
        _settle(id);
        _eq(token.balanceOf(PAYEE), 200_000, "two recurring payouts");
        _eq(token.balanceOf(SETTLER), 20_000, "two recurring bounties");
        _eq(outlay.getRoom(id).settlements, 2, "recurring count");
        require(!outlay.getRoom(id).active, "exhausted recurring room active");
    }

    function testFinalRecurringSettlementReturnsPartialPeriodToSender() public {
        uint256 id = _open(250_000, 100, 60);
        _settle(id);
        _eq(token.balanceOf(SENDER), 9_750_000, "leftover returned before closure");
        _eq(outlay.getRoom(id).remaining, 140_000, "recurring remainder");
        vm.warp(160);
        _settle(id);
        _eq(token.balanceOf(SENDER), 9_780_000, "final partial period not returned");
        _eq(token.balanceOf(PAYEE), 200_000, "final payouts");
        _eq(token.balanceOf(SETTLER), 20_000, "final bounties");
        _eq(token.balanceOf(address(outlay)), 0, "final backing not cleared");
        _eq(outlay.getRoom(id).remaining, 0, "final accounting not cleared");
        require(!outlay.getRoom(id).active, "final room active");
    }

    function testWrongSenderCannotRefundOrChangeRoom() public {
        uint256 id = _open(COST * 2, 100, 60);
        Outlay.Room memory before = outlay.getRoom(id);
        vm.expectRevert(Outlay.NotSender.selector);
        vm.prank(PAYEE);
        outlay.refund(id);
        _sameRoom(outlay.getRoom(id), before);
        _eq(token.balanceOf(address(outlay)), 220_000, "unauthorized refund changed backing");
    }

    function testSecondRefundIsInactiveAndCannotDoubleWithdraw() public {
        uint256 id = _open(COST, 100, 60);
        vm.prank(SENDER);
        outlay.refund(id);
        vm.expectRevert(Outlay.Inactive.selector);
        vm.prank(SENDER);
        outlay.refund(id);
        _eq(token.balanceOf(SENDER), 10_000_000, "refund paid twice");
    }

    function testActiveRecurringRoomCannotRefundAfterFirstPayment() public {
        uint256 id = _open(COST * 2, 100, 60);
        _settle(id);
        Outlay.Room memory before = outlay.getRoom(id);
        require(before.active, "test requires active recurring room");
        vm.expectRevert(Outlay.AlreadyPaid.selector);
        vm.prank(SENDER);
        outlay.refund(id);
        _sameRoom(outlay.getRoom(id), before);
    }

    function testRefundedAndUnknownRoomsCannotSettle() public {
        uint256 id = _open(COST, 100, 0);
        vm.prank(SENDER);
        outlay.refund(id);
        vm.expectRevert(Outlay.Inactive.selector);
        _settle(id);
        vm.expectRevert(Outlay.Inactive.selector);
        _settle(999);
        vm.expectRevert(Outlay.NotSender.selector);
        vm.prank(SENDER);
        outlay.refund(999);
    }

    function testPastDueOpeningIsImmediatelySettleable() public {
        vm.warp(1_000);
        uint256 id = _open(COST, 2, 0);
        _settle(id);
        _eq(token.balanceOf(PAYEE), 100_000, "past due payout");
    }

    function testMaximumIntervalAdvancesFromSettlementTimestamp() public {
        uint256 id = _open(COST * 2, 1, type(uint32).max);
        _settle(id);
        _eq(outlay.getRoom(id).nextRunAt, 4_294_967_395, "maximum interval due time");
        vm.warp(4_294_967_394);
        vm.expectRevert(Outlay.NotDue.selector);
        _settle(id);
        vm.warp(4_294_967_395);
        _settle(id);
        require(!outlay.getRoom(id).active, "maximum interval final settlement");
    }

    function testUint64DueOverflowRevertsAllSettlementState() public {
        uint256 id = _open(COST * 2, 1, 60);
        Outlay.Room memory before = outlay.getRoom(id);
        vm.warp(type(uint64).max - 30);
        vm.expectRevert(abi.encodeWithSignature("Panic(uint256)", 0x11));
        _settle(id);
        _sameRoom(outlay.getRoom(id), before);
        _eq(token.balanceOf(PAYEE), 0, "overflow paid tokens");
        vm.warp(100);
        _settle(id); // The reverted nonReentrant lock must not remain set.
    }

    // Artificial far-future timestamp: characterizes the explicit uint64 cast, not a present exploit.
    function testTimestampBeyondUint64TruncatesNextDueTime() public {
        uint256 id = _open(COST * 3, 1, 60);
        vm.warp(uint256(type(uint64).max) + 101);
        _settle(id);
        _eq(outlay.getRoom(id).nextRunAt, 160, "timestamp-width truncation not reproduced");
        _settle(id);
        _eq(outlay.getRoom(id).settlements, 2, "far-future truncated due time characterization");
    }

    // Explicit artificial storage setup: this does not simulate 2^32 real payments.
    // Outlay's committed layout is mapping slot 2; interval/count/active occupy room slot 3.
    function testCounterWrapCharacterizesRemoteRefundBoundary() public {
        uint256 id = _open(COST * 3, 1, 1);
        bytes32 slot = bytes32(uint256(keccak256(abi.encode(id, uint256(2)))) + 3);
        uint256 packed = uint256(vm.load(address(outlay), slot));
        packed = (packed & ~(uint256(type(uint32).max) << 32)) | (uint256(type(uint32).max) << 32);
        vm.store(address(outlay), slot, bytes32(packed));
        _eq(outlay.getRoom(id).settlements, type(uint32).max, "artificial count setup");
        _settle(id);
        _eq(outlay.getRoom(id).settlements, 0, "uint32 wrap not reproduced");
        require(outlay.getRoom(id).active, "wrap requires an active room");
        vm.prank(SENDER);
        outlay.refund(id);
        _eq(token.balanceOf(SENDER), 9_890_000, "wrapped room refund");
        require(!outlay.getRoom(id).active, "wrapped room refund failed");
    }

    function testNoReturnTokenSupportsFullRefund() public {
        NoReturnToken asset = new NoReturnToken();
        Outlay target = new Outlay(address(asset));
        asset.mint(SENDER, 220_000);
        vm.startPrank(SENDER);
        asset.approve(address(target), 220_000);
        uint256 id = target.openRoom(PAYEE, PAYOUT, BOUNTY, 220_000, 1, 60);
        target.refund(id);
        vm.stopPrank();
        _eq(asset.balanceOf(SENDER), 220_000, "no-return full refund");
        _eq(asset.balanceOf(address(target)), 0, "no-return refund backing");
        require(!target.getRoom(id).active, "no-return refund room active");
    }

    function testFuzzCostOfBoundaries(uint96 amount, uint96 bounty) public {
        uint256 sum = uint256(amount) + uint256(bounty);
        if (amount == 0 || bounty == 0 || sum > type(uint96).max) {
            vm.expectRevert(Outlay.BadArgs.selector);
            outlay.costOf(amount, bounty);
        } else {
            _eq(outlay.costOf(amount, bounty), sum, "valid cost changed");
        }
    }

    function testFuzzOneShotConservesFunding(uint96 extra) public {
        uint96 funded = COST + uint96(uint256(extra) % (uint256(type(uint96).max) - COST + 1));
        _fund(token, outlay, funded);
        uint256 senderBefore = token.balanceOf(SENDER);
        uint256 id = _open(funded, 1, 0);
        _settle(id);
        _eq(token.balanceOf(SENDER), senderBefore - 110_000, "one-shot sender net cost");
        _eq(token.balanceOf(PAYEE), 100_000, "one-shot payout");
        _eq(token.balanceOf(SETTLER), 10_000, "one-shot bounty");
        _eq(token.balanceOf(address(outlay)), 0, "one-shot funding conservation");
    }

    function testFuzzRecurringScheduleUsesSettlementTime(uint32 interval, uint32 delay) public {
        if (interval == 0) interval = 1;
        uint256 id = _open(COST * 2, 100, interval);
        uint256 settledAt = 100 + uint256(delay);
        vm.warp(settledAt);
        _settle(id);
        _eq(outlay.getRoom(id).nextRunAt, settledAt + interval, "recurring due time");
        vm.warp(settledAt + interval - 1);
        vm.expectRevert(Outlay.NotDue.selector);
        _settle(id);
        vm.warp(settledAt + interval);
        _settle(id);
        _eq(token.balanceOf(PAYEE), 200_000, "second recurring payout");
    }
}
