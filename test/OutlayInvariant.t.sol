// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Outlay} from "../contracts/Outlay.sol";
import {BoolReturnToken} from "./Outlay.t.sol";
import {AuditVm} from "./helpers/OutlayFixture.sol";

// Only this handler is fuzzed. Token minting is limited to opening fully backed rooms.
// This campaign deliberately assumes exact unit transfers; R1 has separate adversarial tests.
contract RoomHandler {
    AuditVm private constant vm = AuditVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address public constant SENDER = address(0xA11CE);
    address public constant PAYEE = address(0xB0B);
    address public constant SETTLER = address(0xCA11E2);
    BoolReturnToken public immutable token;
    Outlay public immutable outlay;
    uint256 public totalFunded;
    uint256 public totalPayout;
    uint256 public totalBounty;
    uint256 public totalReturned;
    uint256 public successfulOpens;
    uint256 public successfulSettles;
    uint256 public successfulRefunds;
    mapping(uint256 => uint256) public payments;
    mapping(uint256 => bool) public refunded;

    constructor(BoolReturnToken asset, Outlay target) {
        token = asset;
        outlay = target;
    }

    function open(uint64 seed, uint8 periodSeed, uint32 intervalSeed, bool pastDue) external {
        if (outlay.roomCount() >= 32) return;
        uint96 amount = uint96(1 + uint256(seed) % 1_000_000);
        uint96 bounty = uint96(1 + uint256(seed >> 16) % 10_000);
        uint96 funded = (amount + bounty) * uint96(1 + uint256(periodSeed % 5)) + 7;
        uint32 interval = intervalSeed % 300;
        uint64 due = pastDue ? 1 : uint64(block.timestamp + 60);
        token.mint(SENDER, funded);
        vm.startPrank(SENDER);
        token.approve(address(outlay), funded);
        outlay.openRoom(PAYEE, amount, bounty, funded, due, interval);
        vm.stopPrank();
        totalFunded += funded;
        ++successfulOpens;
    }

    function settle(uint256 seed, uint16 elapsed) external {
        vm.warp(block.timestamp + elapsed % 600);
        uint256 count = outlay.roomCount();
        if (count == 0) return;
        uint256 id = 1 + seed % count;
        Outlay.Room memory before = outlay.getRoom(id);
        vm.prank(SETTLER);
        (bool ok,) = address(outlay).call(abi.encodeCall(Outlay.settle, (id)));
        if (!ok) {
            require(!before.active || block.timestamp < before.nextRunAt, "valid unit-token settle reverted");
            return;
        }
        require(
            before.active && block.timestamp >= before.nextRunAt, "inactive or early settlement succeeded"
        );
        totalPayout += before.amount;
        totalBounty += before.bounty;
        if (!outlay.getRoom(id).active) totalReturned += before.remaining - before.amount - before.bounty;
        ++payments[id];
        ++successfulSettles;
    }

    function refund(uint256 seed, bool authorized) external {
        uint256 count = outlay.roomCount();
        if (count == 0) return;
        uint256 id = 1 + seed % count;
        Outlay.Room memory before = outlay.getRoom(id);
        vm.prank(authorized ? SENDER : PAYEE);
        (bool ok,) = address(outlay).call(abi.encodeCall(Outlay.refund, (id)));
        if (!ok) {
            require(!authorized || !before.active || payments[id] != 0, "valid refund reverted");
            return;
        }
        require(authorized && before.active && payments[id] == 0, "invalid refund succeeded");
        totalReturned += before.remaining;
        refunded[id] = true;
        ++successfulRefunds;
    }
}

contract OutlayInvariantTest {
    AuditVm private constant vm = AuditVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    BoolReturnToken private token;
    Outlay private outlay;
    RoomHandler private handler;

    function setUp() public {
        token = new BoolReturnToken();
        outlay = new Outlay(address(token));
        handler = new RoomHandler(token, outlay);
        vm.warp(100);
        // Ensure each campaign starts with recurring, one-shot, paid and refundable history.
        handler.open(100_000, 2, 60, true);
        handler.open(200_000, 1, 0, true);
        handler.settle(0, 0);
        handler.refund(1, true);
        handler.open(300_000, 3, 30, false);
    }

    function targetContracts() external view returns (address[] memory targets) {
        targets = new address[](1);
        targets[0] = address(handler);
    }

    function invariantUnitTokenBackingEqualsAllRoomLiabilities() public view {
        uint256 remaining;
        for (uint256 id = 1; id <= outlay.roomCount(); ++id) {
            remaining += outlay.getRoom(id).remaining;
        }
        require(token.balanceOf(address(outlay)) == remaining, "unit-token pooled backing mismatch");
        require(
            handler.totalFunded()
                == remaining + handler.totalPayout() + handler.totalBounty() + handler.totalReturned(),
            "funding not conserved"
        );
    }

    function invariantRecipientBalancesMatchSuccessfulOperations() public view {
        require(token.balanceOf(handler.PAYEE()) == handler.totalPayout(), "payee total mismatch");
        require(token.balanceOf(handler.SETTLER()) == handler.totalBounty(), "caller total mismatch");
        require(token.balanceOf(handler.SENDER()) == handler.totalReturned(), "sender return mismatch");
    }

    function invariantClosedRoomsHaveNoRemainingAndRefundsPrecedePayments() public view {
        for (uint256 id = 1; id <= outlay.roomCount(); ++id) {
            Outlay.Room memory room = outlay.getRoom(id);
            require(room.settlements == handler.payments(id), "settlement count mismatch");
            if (!room.active) require(room.remaining == 0, "closed room remaining");
            if (room.active) {
                require(room.remaining >= uint256(room.amount) + room.bounty, "unfunded active room");
            }
            if (handler.refunded(id)) require(room.settlements == 0 && !room.active, "refund after payment");
        }
    }

    function testHandlerExercisesEverySuccessfulOperation() public view {
        require(handler.successfulOpens() == 3, "handler did not open");
        require(handler.successfulSettles() == 1, "handler did not settle");
        require(handler.successfulRefunds() == 1, "handler did not refund");
    }
}
