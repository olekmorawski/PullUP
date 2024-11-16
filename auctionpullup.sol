// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract AuctionEngine is Ownable {
    // Split the Ride struct into logical components to avoid stack too deep
    struct RideCore {
        address passenger;
        uint256 startingBid;
        uint256 currentBid;
        uint256 bidEndTime;
    }

    struct RideDetails {
        string pickupLocation;
        string destination;
    }

    struct RideStatus {
        bool active;
        bool completed;
        bool paid;
        bool cancelled;
        bool firstBidPlaced;
        bool bidAccepted;  // New flag for early bid acceptance
    }

    struct DriverInfo {
        address winningDriver;
        mapping(address => uint256) driverBids;
    }

    // State variables
    mapping(uint256 => RideCore) public rideCore;
    mapping(uint256 => RideDetails) public rideDetails;
    mapping(uint256 => RideStatus) public rideStatus;
    mapping(uint256 => DriverInfo) public driverInfo;
    uint256 public rideCount;

    // Fixed duration constant
    uint256 public constant AUCTION_DURATION = 3 minutes;

    // Events
    event RideCreated(
        uint256 indexed rideId,
        address indexed passenger,
        uint256 startingBid,
        uint256 bidEndTime
    );
    event BidPlaced(
        uint256 indexed rideId,
        address indexed driver,
        uint256 bidAmount,
        bool isWinning
    );
    event BidAccepted(
        uint256 indexed rideId,
        address indexed driver,
        uint256 bidAmount
    );
    event RideCompletedAndPaid(
        uint256 indexed rideId, 
        address indexed driver, 
        uint256 amount
    );
    event RideCancelled(uint256 indexed rideId);

    constructor() Ownable(msg.sender) {}

    modifier rideExists(uint256 _rideId) {
        require(_rideId < rideCount, "Ride does not exist");
        _;
    }

    receive() external payable {
        // Allow contract to receive ETH
    }

    function createRide(
        string calldata _pickupLocation,
        string calldata _destination,
        uint256 _startingBid
    ) external returns (uint256) {
        require(_startingBid > 0, "Invalid starting bid");

        uint256 rideId = rideCount++;
        
        rideCore[rideId] = RideCore({
            passenger: msg.sender,
            startingBid: _startingBid,
            currentBid: _startingBid,
            bidEndTime: block.timestamp + AUCTION_DURATION
        });

        rideDetails[rideId] = RideDetails({
            pickupLocation: _pickupLocation,
            destination: _destination
        });

        rideStatus[rideId] = RideStatus({
            active: true,
            completed: false,
            paid: false,
            cancelled: false,
            firstBidPlaced: false,
            bidAccepted: false
        });

        emit RideCreated(
            rideId,
            msg.sender,
            _startingBid,
            rideCore[rideId].bidEndTime
        );

        return rideId;
    }

    function placeBid(
        uint256 _rideId,
        uint256 _bidAmount
    ) external rideExists(_rideId) {
        RideCore storage core = rideCore[_rideId];
        RideStatus storage status = rideStatus[_rideId];
        DriverInfo storage drivers = driverInfo[_rideId];

        require(status.active, "Ride not active");
        require(!status.cancelled, "Ride cancelled");
        require(!status.bidAccepted, "Bid already accepted");
        require(block.timestamp < core.bidEndTime, "Bidding ended");
        require(msg.sender != core.passenger, "Passenger cannot bid");

        bool isWinning = false;
        if (!status.firstBidPlaced) {
            require(_bidAmount <= core.startingBid, "Bid exceeds starting bid");
            core.currentBid = _bidAmount;
            drivers.winningDriver = msg.sender;
            status.firstBidPlaced = true;
            isWinning = true;
        } else {
            require(_bidAmount < core.currentBid, "Bid not lower than current");
            core.currentBid = _bidAmount;
            drivers.winningDriver = msg.sender;
            isWinning = true;
        }

        drivers.driverBids[msg.sender] = _bidAmount;

        emit BidPlaced(_rideId, msg.sender, _bidAmount, isWinning);
    }

    function acceptBid(uint256 _rideId) external rideExists(_rideId) {
        RideCore storage core = rideCore[_rideId];
        RideStatus storage status = rideStatus[_rideId];
        DriverInfo storage drivers = driverInfo[_rideId];

        require(msg.sender == core.passenger, "Not passenger");
        require(status.active, "Not active");
        require(!status.cancelled, "Ride cancelled");
        require(!status.bidAccepted, "Bid already accepted");
        require(status.firstBidPlaced, "No bids placed");

        status.bidAccepted = true;
        // Set bidEndTime to current time to close the auction early
        core.bidEndTime = block.timestamp;

        emit BidAccepted(_rideId, drivers.winningDriver, core.currentBid);
    }

    function completeRide(
        uint256 _rideId
    ) external payable rideExists(_rideId) {
        RideCore storage core = rideCore[_rideId];
        RideStatus storage status = rideStatus[_rideId];
        DriverInfo storage drivers = driverInfo[_rideId];

        require(msg.sender == core.passenger, "Not passenger");
        require(status.active, "Not active");
        require(!status.cancelled, "Ride cancelled");
        require(!status.completed, "Already completed");
        require(status.firstBidPlaced, "No bids placed");
        require(msg.value == core.currentBid, "Incorrect payment amount");
        
        // Ride can be completed if either the auction time ended OR bid was accepted
        require(block.timestamp >= core.bidEndTime || status.bidAccepted, "Bidding ongoing");

        // Mark ride as completed and paid
        status.completed = true;
        status.paid = true;
        status.active = false;

        // Transfer payment to winning driver
        (bool success, ) = drivers.winningDriver.call{value: msg.value}("");
        require(success, "Payment failed");

        emit RideCompletedAndPaid(_rideId, drivers.winningDriver, msg.value);
    }

    function cancelRide(uint256 _rideId) external rideExists(_rideId) {
        RideCore storage core = rideCore[_rideId];
        RideStatus storage status = rideStatus[_rideId];

        require(msg.sender == core.passenger, "Not passenger");
        require(status.active, "Not active");
        require(!status.completed, "Already completed");
        require(!status.cancelled, "Already cancelled");

        status.cancelled = true;
        status.active = false;

        emit RideCancelled(_rideId);
    }

    // View functions
    function getRideCore(uint256 _rideId) external view rideExists(_rideId) returns (
        address passenger,
        uint256 startingBid,
        uint256 currentBid,
        uint256 bidEndTime
    ) {
        RideCore storage core = rideCore[_rideId];
        return (
            core.passenger,
            core.startingBid,
            core.currentBid,
            core.bidEndTime
        );
    }

    function getRideDetails(uint256 _rideId) external view rideExists(_rideId) returns (
        string memory pickupLocation,
        string memory destination
    ) {
        RideDetails storage details = rideDetails[_rideId];
        return (details.pickupLocation, details.destination);
    }

    function getRideStatus(uint256 _rideId) external view rideExists(_rideId) returns (
        bool active,
        bool completed,
        bool paid,
        bool cancelled,
        bool firstBidPlaced,
        bool bidAccepted
    ) {
        RideStatus storage status = rideStatus[_rideId];
        return (
            status.active,
            status.completed,
            status.paid,
            status.cancelled,
            status.firstBidPlaced,
            status.bidAccepted
        );
    }

    function getDriverInfo(uint256 _rideId) external view rideExists(_rideId) returns (
        address winningDriver
    ) {
        DriverInfo storage drivers = driverInfo[_rideId];
        return drivers.winningDriver;
    }

    function getDriverBid(uint256 _rideId, address _driver) external view rideExists(_rideId) returns (
        uint256 bidAmount
    ) {
        DriverInfo storage drivers = driverInfo[_rideId];
        return drivers.driverBids[_driver];
    }
}