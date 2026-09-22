// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Outlay} from "../contracts/Outlay.sol";

interface Vm {
    function expectRevert(bytes4 selector) external;
    function prank(address sender) external;
    function startPrank(address sender) external;
    function stopPrank() external;
    function warp(uint256 timestamp) external;
}

contract BoolReturnToken {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external virtual returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external virtual returns (bool) {
        uint256 permitted = allowance[from][msg.sender];
        require(permitted >= amount, "allowance");
        allowance[from][msg.sender] = permitted - amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }
}

contract NoReturnToken {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
    }

    function transfer(address to, uint256 amount) external {
        _transfer(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external {
        uint256 permitted = allowance[from][msg.sender];
        require(permitted >= amount, "allowance");
        allowance[from][msg.sender] = permitted - amount;
        _transfer(from, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }
}

contract ReentrantToken is BoolReturnToken {
    Outlay public target;
    uint256 public targetRoom;
    bool public attackEnabled;
    bool public reentrySucceeded;

    function arm(Outlay target_, uint256 targetRoom_) external {
        target = target_;
        targetRoom = targetRoom_;
        attackEnabled = true;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        if (attackEnabled && msg.sender == address(target)) {
            attackEnabled = false;
            (reentrySucceeded,) = address(target).call(abi.encodeCall(Outlay.settle, (targetRoom)));
        }
        _transfer(msg.sender, to, amount);
        return true;
    }
}

contract OutlayTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address private constant SENDER = address(0xA11CE);
    address private constant PAYEE = address(0xB0B);
    address private constant SETTLER = address(0xCA11E2);

    uint96 private constant PAYOUT = 100_000;
    uint96 private constant BOUNTY = 10_000;
    uint96 private constant COST = PAYOUT + BOUNTY;

    BoolReturnToken private token;
    Outlay private outlay;

    function setUp() public {
        token = new BoolReturnToken();
        outlay = new Outlay(address(token));
        token.mint(SENDER, 10_000_000);

        vm.prank(SENDER);
        token.approve(address(outlay), type(uint256).max);
    }

    function testOpenRoomRejectsZeroBounty() public {
        vm.expectRevert(Outlay.BadArgs.selector);
        vm.prank(SENDER);
        outlay.openRoom(PAYEE, PAYOUT, 0, PAYOUT, 1, 0);
    }

    function testOpenRoomRejectsZeroAmount() public {
        vm.expectRevert(Outlay.BadArgs.selector);
        vm.prank(SENDER);
        outlay.openRoom(PAYEE, 0, BOUNTY, BOUNTY, 1, 0);
    }

    function testOpenRoomRejectsSenderAsPayee() public {
        vm.expectRevert(Outlay.BadArgs.selector);
        vm.prank(SENDER);
        outlay.openRoom(SENDER, PAYOUT, BOUNTY, COST, 1, 0);
    }

    function testOpenRoomRejectsUnderfunding() public {
        vm.expectRevert(Outlay.BadArgs.selector);
        vm.prank(SENDER);
        outlay.openRoom(PAYEE, PAYOUT, BOUNTY, COST - 1, 1, 0);
    }

    function testPrematureSettleReverts() public {
        uint256 roomId = _open(COST, 100, 0);
        vm.warp(99);

        vm.expectRevert(Outlay.NotDue.selector);
        vm.prank(SETTLER);
        outlay.settle(roomId);
    }

    function testSettlePaysPayeeAndSettlerBalances() public {
        uint256 roomId = _open(COST, 1, 0);
        vm.warp(1);

        vm.prank(SETTLER);
        outlay.settle(roomId);

        _assertEq(token.balanceOf(PAYEE), PAYOUT, "payee payout");
        _assertEq(token.balanceOf(SETTLER), BOUNTY, "settler bounty");
        _assertEq(token.balanceOf(address(outlay)), 0, "room exhausted");
    }

    function testRoomsCannotShareRemaining() public {
        uint256 first = _open(COST, 1, 0);
        uint256 second = _open(COST * 2, 1_000, 60);
        vm.warp(1);

        vm.prank(SETTLER);
        outlay.settle(first);

        Outlay.Room memory firstRoom = outlay.getRoom(first);
        Outlay.Room memory secondRoom = outlay.getRoom(second);
        _assertEq(firstRoom.remaining, 0, "first depleted");
        _assertEq(secondRoom.remaining, COST * 2, "second isolated");
        _assertEq(token.balanceOf(address(outlay)), COST * 2, "second backing intact");
    }

    function testIntervalAdvancesFromSettlementTime() public {
        uint256 roomId = _open(COST * 2, 100, 60);
        vm.warp(145);

        vm.prank(SETTLER);
        outlay.settle(roomId);

        Outlay.Room memory room = outlay.getRoom(roomId);
        _assertEq(room.nextRunAt, 205, "next run uses settle time");
        _assertEq(room.remaining, COST, "one period charged");
        require(room.active, "recurring room closed");
    }

    function testOneShotReturnsLeftoverInSameSettlement() public {
        uint96 funded = COST + 40_000;
        uint256 senderAfterFunding = token.balanceOf(SENDER) - funded;
        uint256 roomId = _open(funded, 1, 0);
        vm.warp(1);

        vm.prank(SETTLER);
        outlay.settle(roomId);

        Outlay.Room memory room = outlay.getRoom(roomId);
        _assertEq(token.balanceOf(SENDER), senderAfterFunding + 40_000, "leftover returned");
        _assertEq(room.remaining, 0, "no stranded balance");
        require(!room.active, "one-shot remains active");
    }

    function testRefundAfterSettlementRevertsAlreadyPaid() public {
        uint256 roomId = _open(COST, 1, 0);
        vm.warp(1);
        vm.prank(SETTLER);
        outlay.settle(roomId);

        vm.expectRevert(Outlay.AlreadyPaid.selector);
        vm.prank(SENDER);
        outlay.refund(roomId);
    }

    function testRefundBeforeSettlementReturnsTheWholeRoom() public {
        uint96 funded = COST * 2;
        uint256 senderBeforeFunding = token.balanceOf(SENDER);
        uint256 roomId = _open(funded, 100, 60);

        vm.prank(SENDER);
        outlay.refund(roomId);

        Outlay.Room memory room = outlay.getRoom(roomId);
        _assertEq(token.balanceOf(SENDER), senderBeforeFunding, "whole room refunded");
        _assertEq(token.balanceOf(address(outlay)), 0, "contract balance cleared");
        _assertEq(room.remaining, 0, "room accounting cleared");
        require(!room.active, "refunded room remains active");
    }

    function testSecondRecurringSettlementRevertsUntilNextInterval() public {
        uint256 roomId = _open(COST * 2, 100, 60);
        vm.warp(100);
        vm.prank(SETTLER);
        outlay.settle(roomId);

        vm.warp(159);
        vm.expectRevert(Outlay.NotDue.selector);
        vm.prank(SETTLER);
        outlay.settle(roomId);

        Outlay.Room memory room = outlay.getRoom(roomId);
        _assertEq(room.nextRunAt, 160, "next interval changed");
        _assertEq(room.settlements, 1, "second settlement counted early");
        _assertEq(room.remaining, COST, "second period charged early");
    }

    function testSupportsTokenWithNoReturnData() public {
        NoReturnToken noReturn = new NoReturnToken();
        Outlay noReturnOutlay = new Outlay(address(noReturn));
        noReturn.mint(SENDER, COST);
        vm.startPrank(SENDER);
        noReturn.approve(address(noReturnOutlay), COST);
        uint256 roomId = noReturnOutlay.openRoom(PAYEE, PAYOUT, BOUNTY, COST, 1, 0);
        vm.stopPrank();
        vm.warp(1);

        vm.prank(SETTLER);
        noReturnOutlay.settle(roomId);

        _assertEq(noReturn.balanceOf(PAYEE), PAYOUT, "no-return payee payout");
        _assertEq(noReturn.balanceOf(SETTLER), BOUNTY, "no-return settler bounty");
    }

    function testReentrantTokenCannotDoublePay() public {
        ReentrantToken reentrant = new ReentrantToken();
        Outlay guarded = new Outlay(address(reentrant));
        reentrant.mint(SENDER, COST);
        vm.startPrank(SENDER);
        reentrant.approve(address(guarded), COST);
        uint256 roomId = guarded.openRoom(PAYEE, PAYOUT, BOUNTY, COST, 1, 0);
        vm.stopPrank();
        reentrant.arm(guarded, roomId);
        vm.warp(1);

        vm.prank(SETTLER);
        guarded.settle(roomId);

        require(!reentrant.reentrySucceeded(), "reentrant settle succeeded");
        _assertEq(reentrant.balanceOf(PAYEE), PAYOUT, "single payee payout");
        _assertEq(reentrant.balanceOf(SETTLER), BOUNTY, "single settler bounty");
        Outlay.Room memory room = guarded.getRoom(roomId);
        _assertEq(room.settlements, 1, "single settlement");
    }

    function _open(uint96 funded, uint64 dueAt, uint32 interval) internal returns (uint256) {
        vm.prank(SENDER);
        return outlay.openRoom(PAYEE, PAYOUT, BOUNTY, funded, dueAt, interval);
    }

    function _assertEq(uint256 actual, uint256 expected, string memory message) internal pure {
        require(actual == expected, message);
    }
}
