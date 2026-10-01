// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Outlay} from "../contracts/Outlay.sol";
import {OutlayFixture} from "./helpers/OutlayFixture.sol";
import {AdversarialToken} from "./helpers/AdversarialToken.sol";

contract OutlayAdversarialTest is OutlayFixture {
    AdversarialToken private asset;

    function setUp() public override {
        asset = new AdversarialToken();
        token = asset;
        outlay = new Outlay(address(asset));
        _fund(token, outlay, 10_000_000);
        vm.warp(100);
    }

    function testFuzzFailedPullRollsBackRoomAndAllowance(uint8 choice) public {
        AdversarialToken.ReturnMode mode = _failure(choice);
        asset.setReturns(mode, AdversarialToken.ReturnMode.True, 0);
        _expectFailure(mode);
        _open(COST, 1, 0);
        _eq(outlay.roomCount(), 0, "failed pull consumed id");
        require(!outlay.getRoom(1).active, "failed pull left active room");
        _eq(asset.balanceOf(SENDER), 10_000_000, "failed pull debited sender");
        _eq(asset.balanceOf(address(outlay)), 0, "failed pull credited target");
        _eq(asset.allowance(SENDER, address(outlay)), 10_000_000, "failed pull spent allowance");
        asset.setReturns(AdversarialToken.ReturnMode.True, AdversarialToken.ReturnMode.True, 0);
        _eq(_open(COST, 1, 0), 1, "failed pull left lock set");
    }

    function testFuzzFailedSettlementLegRollsBackAllRecipients(uint8 choice, uint8 legChoice) public {
        uint256 id = _open(150_000, 1, 0); // payout, bounty and sender leftover are all nonzero.
        Outlay.Room memory before = outlay.getRoom(id);
        AdversarialToken.ReturnMode mode = _failure(choice);
        uint256 leg = 1 + uint256(legChoice % 3);
        asset.setReturns(AdversarialToken.ReturnMode.True, mode, leg);
        _expectFailure(mode);
        _settle(id);
        _sameRoom(outlay.getRoom(id), before);
        _eq(asset.balanceOf(PAYEE), 0, "failed settlement kept payout");
        _eq(asset.balanceOf(SETTLER), 0, "failed settlement kept bounty");
        _eq(asset.balanceOf(SENDER), 9_850_000, "failed settlement kept leftover");
        _eq(asset.balanceOf(address(outlay)), 150_000, "failed settlement lost backing");
        _eq(asset.pushes(), 0, "token side effects survived revert");
        asset.setReturns(AdversarialToken.ReturnMode.True, AdversarialToken.ReturnMode.True, 0);
        _settle(id);
        _eq(asset.balanceOf(SENDER), 9_890_000, "retry did not return leftover");
    }

    function testFuzzFailedRefundRollsBackRoomAndCanRetry(uint8 choice) public {
        uint256 id = _open(COST * 2, 1, 60);
        Outlay.Room memory before = outlay.getRoom(id);
        AdversarialToken.ReturnMode mode = _failure(choice);
        asset.setReturns(AdversarialToken.ReturnMode.True, mode, 0);
        _expectFailure(mode);
        vm.prank(SENDER);
        outlay.refund(id);
        _sameRoom(outlay.getRoom(id), before);
        _eq(asset.balanceOf(SENDER), 9_780_000, "failed refund changed sender balance");
        _eq(asset.balanceOf(address(outlay)), 220_000, "failed refund lost backing");
        asset.setReturns(AdversarialToken.ReturnMode.True, AdversarialToken.ReturnMode.True, 0);
        vm.prank(SENDER);
        outlay.refund(id);
        _eq(asset.balanceOf(SENDER), 10_000_000, "refund retry failed");
    }

    function testEmptyReturnAcceptedForPullAndAllThreeSettlementLegs() public {
        asset.setReturns(AdversarialToken.ReturnMode.Empty, AdversarialToken.ReturnMode.Empty, 0);
        uint256 id = _open(150_000, 1, 0);
        _settle(id);
        _eq(asset.balanceOf(PAYEE), 100_000, "empty-return payout");
        _eq(asset.balanceOf(SETTLER), 10_000, "empty-return bounty");
        _eq(asset.balanceOf(SENDER), 9_890_000, "empty-return leftover");
        _eq(asset.pushes(), 3, "empty-return settlement legs");
    }

    function testSettlementTransferOrderIsPayeeCallerThenSender() public {
        uint256 id = _open(150_000, 1, 0);
        _settle(id);
        require(asset.recipients(0) == PAYEE, "first transfer is not payout");
        require(asset.recipients(1) == SETTLER, "second transfer is not bounty");
        require(asset.recipients(2) == SENDER, "third transfer is not leftover");
    }

    function testPullCallbackSeesOpenStateAndCannotEnterAnyMutation() public {
        uint256 other = _open(COST, 1, 0);
        asset.armCallbacks(outlay, 2, other, true);
        uint256 id = _open(COST, 1, 0);
        _eq(id, 2, "open callback room id");
        _eq(asset.observedRoomCount(), 2, "id written after pull");
        _eq(asset.observedRemaining(), 110_000, "remaining written after pull");
        require(asset.observedActive(), "active written after pull");
        _eq(asset.blockedCallbacks(), 4, "open callback did not cover all entries");
        _eq(outlay.getRoom(other).remaining, 110_000, "callback spent other room");
    }

    function testSettlementCallbackSeesClosedStateAndBlocksCrossRoomEntries() public {
        uint256 id = _open(150_000, 1, 0);
        uint256 other = _open(COST, 1, 0);
        asset.armCallbacks(outlay, id, other, false);
        _settle(id);
        _eq(asset.observedRemaining(), 0, "remaining changed after payout call");
        _eq(asset.observedSettlements(), 1, "count changed after payout call");
        require(!asset.observedActive(), "active changed after payout call");
        _eq(asset.blockedCallbacks(), 4, "settle callback did not cover all entries");
        _eq(outlay.getRoom(other).remaining, 110_000, "settle callback spent other room");
        _eq(asset.balanceOf(PAYEE), 100_000, "settle callback double paid");
    }

    function testRecurringCallbackSeesNewDueTimeAndChargedRemaining() public {
        uint256 id = _open(COST * 2, 1, 60);
        asset.armCallbacks(outlay, id, id, false);
        _settle(id);
        _eq(asset.observedRemaining(), 110_000, "recurring accounting updated after push");
        _eq(asset.observedSettlements(), 1, "recurring count updated after push");
        require(asset.observedActive(), "recurring callback state");
        _eq(outlay.getRoom(id).nextRunAt, 160, "recurring due timestamp");
        _eq(asset.blockedCallbacks(), 4, "recurring callback did not cover all entries");
    }

    function testRefundCallbackSeesClosedStateAndBlocksAllMutations() public {
        uint256 id = _open(COST, 1, 0);
        uint256 other = _open(COST, 1, 0);
        asset.armCallbacks(outlay, id, other, false);
        vm.prank(SENDER);
        outlay.refund(id);
        _eq(asset.observedRemaining(), 0, "refund accounting updated after push");
        require(!asset.observedActive(), "refund active updated after push");
        _eq(asset.blockedCallbacks(), 4, "refund callback did not cover all entries");
        _eq(outlay.getRoom(other).remaining, 110_000, "refund callback spent other room");
        _eq(asset.balanceOf(SENDER), 9_890_000, "refund callback double withdrew");
    }

    function testPausedTokenPreventsOpeningWithoutLeavingRoom() public {
        asset.setPaused(true);
        vm.expectRevert(Outlay.TransferFailed.selector);
        _open(COST, 1, 0);
        _eq(outlay.roomCount(), 0, "paused open left room");
        asset.setPaused(false);
        _eq(_open(COST, 1, 0), 1, "unpaused opening failed");
    }

    function testPausedTokenBlocksSettlementAndRefundThenAllowsRecovery() public {
        uint256 id = _open(COST, 1, 0);
        Outlay.Room memory before = outlay.getRoom(id);
        asset.setPaused(true);
        vm.expectRevert(Outlay.TransferFailed.selector);
        _settle(id);
        vm.expectRevert(Outlay.TransferFailed.selector);
        vm.prank(SENDER);
        outlay.refund(id);
        _sameRoom(outlay.getRoom(id), before);
        asset.setPaused(false);
        vm.prank(SENDER);
        outlay.refund(id);
        _eq(asset.balanceOf(SENDER), 10_000_000, "unpaused refund failed");
    }

    function testFrozenPayeeBlocksSettlementButSenderCanRefundBeforePayment() public {
        uint256 id = _open(COST, 1, 0);
        Outlay.Room memory before = outlay.getRoom(id);
        asset.setFrozen(PAYEE, true);
        vm.expectRevert(Outlay.TransferFailed.selector);
        _settle(id);
        _sameRoom(outlay.getRoom(id), before);
        vm.prank(SENDER);
        outlay.refund(id);
        _eq(asset.balanceOf(SENDER), 10_000_000, "unpaid frozen-payee refund");
    }

    function testFrozenCallerRollsBackPayeeTransferOnFailedBounty() public {
        uint256 id = _open(COST, 1, 0);
        Outlay.Room memory before = outlay.getRoom(id);
        asset.setFrozen(SETTLER, true);
        vm.expectRevert(Outlay.TransferFailed.selector);
        _settle(id);
        _sameRoom(outlay.getRoom(id), before);
        _eq(asset.balanceOf(PAYEE), 0, "frozen caller left partial payout");
        asset.setFrozen(SETTLER, false);
        _settle(id);
    }

    function testFrozenOutlayBlocksAllWithdrawalsWithoutChangingAccounting() public {
        uint256 id = _open(COST, 1, 0);
        Outlay.Room memory before = outlay.getRoom(id);
        asset.setFrozen(address(outlay), true);
        vm.expectRevert(Outlay.TransferFailed.selector);
        _settle(id);
        vm.expectRevert(Outlay.TransferFailed.selector);
        vm.prank(SENDER);
        outlay.refund(id);
        _sameRoom(outlay.getRoom(id), before);
        _eq(asset.balanceOf(address(outlay)), 110_000, "freeze moved backing");
    }

    // R1 is an explicit conditional dependency, not a claim about current canonical USDG.
    function testFeeOnTransferOverstatesRemainingAndCanImpairOtherRoom() public {
        asset.setFundingFee(10_000);
        uint256 first = _open(COST, 1, 0);
        uint256 second = _open(COST, 1, 0);
        _eq(asset.balanceOf(address(outlay)), 200_000, "fee shortfall not reproduced");
        _eq(outlay.getRoom(first).remaining + outlay.getRoom(second).remaining, 220_000, "room liabilities");
        _settle(first);
        _eq(outlay.getRoom(second).remaining, 110_000, "other room accounting changed");
        Outlay.Room memory before = outlay.getRoom(second);
        vm.expectRevert(Outlay.TransferFailed.selector);
        _settle(second);
        _sameRoom(outlay.getRoom(second), before);
        _eq(asset.balanceOf(address(outlay)), 90_000, "shortfall backing");
        _eq(asset.balanceOf(PAYEE), 100_000, "failed second room partially paid");
    }

    function testNegativeBalanceChangeCanImpairAnotherRoomsBacking() public {
        uint256 first = _open(COST, 1, 0);
        uint256 second = _open(COST, 1, 0);
        asset.removeBacking(address(outlay), 10_000);
        _settle(first);
        _eq(outlay.getRoom(second).remaining, 110_000, "negative balance changed stored remaining");
        vm.expectRevert(Outlay.TransferFailed.selector);
        vm.prank(SENDER);
        outlay.refund(second);
        _eq(asset.balanceOf(address(outlay)), 100_000, "remaining backing under shortfall");
    }

    function testGenericEOATokenAcceptsEmptyCallsWithoutBacking() public {
        Outlay misconfigured = new Outlay(address(0xDEAD));
        vm.prank(SENDER);
        uint256 id = misconfigured.openRoom(PAYEE, PAYOUT, BOUNTY, COST, 1, 0);
        _eq(misconfigured.getRoom(id).remaining, 110_000, "EOA configuration characterization");
        vm.prank(SETTLER);
        misconfigured.settle(id);
        require(!misconfigured.getRoom(id).active, "EOA configuration did not close");
        // No real token was involved. Runtime verification rejects this immutable token in the UI.
    }

    function _failure(uint8 choice) private pure returns (AdversarialToken.ReturnMode) {
        uint8 selected = choice % 4;
        if (selected == 0) return AdversarialToken.ReturnMode.False;
        if (selected == 1) return AdversarialToken.ReturnMode.Malformed;
        if (selected == 2) return AdversarialToken.ReturnMode.Short;
        return AdversarialToken.ReturnMode.Revert;
    }

    function _expectFailure(AdversarialToken.ReturnMode mode) private {
        if (mode == AdversarialToken.ReturnMode.Malformed || mode == AdversarialToken.ReturnMode.Short) {
            vm.expectRevert();
        } else {
            vm.expectRevert(Outlay.TransferFailed.selector);
        }
    }
}
