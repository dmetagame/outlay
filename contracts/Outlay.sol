// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Outlay — scheduled USDG payout rooms with a settler bounty
/// @notice Sender locks isolated USDG per room (payout + bounty).
///         Anyone may settle when due; the settler is paid the bounty.
///         One-shot rooms close on payout and return leftover to the sender.
///         Cancel/refund is only allowed before the first settlement.
contract Outlay {
    address public immutable usdg;
    uint256 public roomCount;
    uint256 private locked;

    struct Room {
        address sender;
        address payee;
        uint96 amount;
        uint96 bounty;
        uint96 remaining;
        uint64 nextRunAt;
        uint32 interval;
        uint32 settlements;
        bool active;
    }

    mapping(uint256 => Room) public rooms;

    event RoomOpened(
        uint256 indexed id,
        address indexed sender,
        address indexed payee,
        uint96 amount,
        uint96 bounty,
        uint96 funded,
        uint64 nextRunAt,
        uint32 interval
    );
    event Settled(
        uint256 indexed id,
        address indexed payee,
        address indexed settler,
        uint96 amount,
        uint96 bounty,
        uint64 nextRunAt,
        bool stillActive
    );
    event Refunded(uint256 indexed id, address indexed sender, uint96 amount);

    error BadArgs();
    error Inactive();
    error NotDue();
    error NotSender();
    error AlreadyPaid();
    error Reentrant();
    error TransferFailed();

    modifier nonReentrant() {
        if (locked != 0) revert Reentrant();
        locked = 1;
        _;
        locked = 0;
    }

    constructor(address usdg_) {
        if (usdg_ == address(0)) revert BadArgs();
        usdg = usdg_;
    }

    function costOf(uint96 amount, uint96 bounty) public pure returns (uint96) {
        if (amount == 0 || bounty == 0) revert BadArgs();
        uint256 sum = uint256(amount) + uint256(bounty);
        if (sum > type(uint96).max) revert BadArgs();
        return uint96(sum);
    }

    function openRoom(
        address payee,
        uint96 amount,
        uint96 bounty,
        uint96 funded,
        uint64 nextRunAt,
        uint32 interval
    ) external nonReentrant returns (uint256 id) {
        if (payee == address(0) || payee == msg.sender) revert BadArgs();
        if (nextRunAt == 0) revert BadArgs();
        uint96 cost = costOf(amount, bounty);
        if (funded < cost) revert BadArgs();

        id = ++roomCount;
        rooms[id] = Room({
            sender: msg.sender,
            payee: payee,
            amount: amount,
            bounty: bounty,
            remaining: funded,
            nextRunAt: nextRunAt,
            interval: interval,
            settlements: 0,
            active: true
        });

        _pull(msg.sender, funded);
        emit RoomOpened(id, msg.sender, payee, amount, bounty, funded, nextRunAt, interval);
    }

    function settle(uint256 id) external nonReentrant {
        Room storage room = rooms[id];
        if (!room.active) revert Inactive();
        if (block.timestamp < room.nextRunAt) revert NotDue();

        uint96 cost = costOf(room.amount, room.bounty);
        if (room.remaining < cost) revert Inactive();

        address payee = room.payee;
        address sender = room.sender;
        uint96 paid = room.amount;
        uint96 bounty = room.bounty;

        room.remaining -= cost;
        unchecked {
            room.settlements += 1;
        }

        bool still = room.interval != 0 && room.remaining >= cost;
        uint64 next = 0;
        uint96 leftover = 0;
        if (still) {
            next = uint64(block.timestamp) + room.interval;
            room.nextRunAt = next;
        } else {
            room.active = false;
            leftover = room.remaining;
            room.remaining = 0;
        }

        _push(payee, paid);
        _push(msg.sender, bounty);
        if (leftover > 0) {
            _push(sender, leftover);
        }
        emit Settled(id, payee, msg.sender, paid, bounty, next, still);
    }

    function refund(uint256 id) external nonReentrant {
        Room storage room = rooms[id];
        if (msg.sender != room.sender) revert NotSender();
        if (room.settlements != 0) revert AlreadyPaid();
        if (!room.active) revert Inactive();

        uint96 leftover = room.remaining;
        room.remaining = 0;
        room.active = false;
        if (leftover > 0) {
            _push(room.sender, leftover);
        }
        emit Refunded(id, room.sender, leftover);
    }

    function getRoom(uint256 id) external view returns (Room memory) {
        return rooms[id];
    }

    function _pull(address from, uint256 amount) internal {
        _call(abi.encodeWithSelector(0x23b872dd, from, address(this), amount));
    }

    function _push(address to, uint256 amount) internal {
        _call(abi.encodeWithSelector(0xa9059cbb, to, amount));
    }

    function _call(bytes memory data) internal {
        (bool ok, bytes memory ret) = usdg.call(data);
        if (!ok) revert TransferFailed();
        if (ret.length != 0 && !abi.decode(ret, (bool))) revert TransferFailed();
    }
}
