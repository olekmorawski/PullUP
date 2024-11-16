"use client";

import { useEffect, useState } from "react";
import { MapPin, User, ArrowDown, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapComponent } from "@/components/MapComponent";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { CONTRACT_ABI } from "@/abi";
import { CONTRACT_ADDRESS } from "@/address";

interface RideCore {
  passenger: string;
  startingBid: bigint;
  currentBid: bigint;
  bidEndTime: bigint;
}

interface RideStatus {
  active: boolean;
  completed: boolean;
  paid: boolean;
  cancelled: boolean;
  firstBidPlaced: boolean;
  bidAccepted: boolean;
}

interface RideDetails {
  pickupLocation: string;
  destination: string;
}

export default function Driver() {
  const { address, isConnected } = useAccount();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Read ride count
  const { data: rideCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "rideCount",
  });

  const currentRideId = rideCount ? Number(rideCount) - 1 : 0;

  // Read ride details
  const { data: rideDetails } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRideDetails",
    args: [BigInt(currentRideId)],
  }) as { data: [string, string] };

  // Read ride core
  const { data: rideCore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRideCore",
    args: [BigInt(currentRideId)],
  }) as { data: [string, bigint, bigint, bigint] };

  // Read ride status
  const { data: rideStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRideStatus",
    args: [BigInt(currentRideId)],
  }) as { data: [boolean, boolean, boolean, boolean, boolean, boolean] };

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash,
  });

  // Parse contract responses
  const parsedRideCore = rideCore
    ? {
        passenger: rideCore[0],
        startingBid: rideCore[1],
        currentBid: rideCore[2],
        bidEndTime: rideCore[3],
      }
    : null;

  const parsedRideStatus = rideStatus
    ? {
        active: rideStatus[0],
        completed: rideStatus[1],
        paid: rideStatus[2],
        cancelled: rideStatus[3],
        firstBidPlaced: rideStatus[4],
        bidAccepted: rideStatus[5],
      }
    : null;

  const parsedRideDetails = rideDetails
    ? {
        pickupLocation: rideDetails[0],
        destination: rideDetails[1],
      }
    : null;

  // Update auction timer
  useEffect(() => {
    if (
      parsedRideCore &&
      parsedRideStatus?.active &&
      !parsedRideStatus?.completed &&
      !parsedRideStatus?.cancelled
    ) {
      const endTime = Number(parsedRideCore.bidEndTime) * 1000;

      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        setTimeLeft(Math.floor(remaining / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [parsedRideCore, parsedRideStatus]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePlaceBid = async () => {
    try {
      if (!isConnected) {
        setError("Please connect your wallet");
        return;
      }

      const bidValue = parseFloat(bidAmount);
      if (isNaN(bidValue) || bidValue <= 0) {
        setError("Please enter a valid bid amount");
        return;
      }

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "placeBid",
        args: [BigInt(currentRideId), parseEther(bidAmount)],
      });

      setBidAmount("");
      setError(null);
    } catch (err) {
      console.error("Error placing bid:", err);
      setError(err instanceof Error ? err.message : "Failed to place bid");
    }
  };

  // Early return if no active ride
  if (
    !parsedRideStatus?.active ||
    parsedRideStatus?.completed ||
    parsedRideStatus?.cancelled
  ) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <div className="flex-1 relative">
          <MapComponent />
        </div>
        <Card className="rounded-t-xl shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">No active rides available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 relative">
        <MapComponent />
      </div>

      <Card className="rounded-t-xl shadow-lg">
        <CardContent className="p-4">
          {/* Ride Details */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-green-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Pickup</p>
                <p className="text-sm font-semibold">
                  {parsedRideDetails?.pickupLocation || "Loading..."}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Destination</p>
                <p className="text-sm font-semibold">
                  {parsedRideDetails?.destination || "Loading..."}
                </p>
              </div>
            </div>
          </div>

          {/* Timer and Passenger */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm font-semibold">
                {parsedRideCore
                  ? `${parsedRideCore.passenger.slice(
                      0,
                      6
                    )}...${parsedRideCore.passenger.slice(-4)}`
                  : "Loading..."}
              </span>
            </div>
            <div className="text-xl font-bold text-orange-500">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Current Price and Bid Interface */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Current Bid:</div>
              <div className="text-lg font-bold text-green-600">
                {parsedRideCore ? formatEther(parsedRideCore.currentBid) : "0"}{" "}
                ETH
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="ETH"
                className="h-10 w-24 text-center"
                step="0.01"
                min="0"
                disabled={isPending || isWaitingForTx}
              />
              <Button
                onClick={handlePlaceBid}
                className="h-10 flex-1"
                disabled={
                  !bidAmount || isPending || isWaitingForTx || timeLeft === 0
                }
              >
                {isPending || isWaitingForTx ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isPending ? "Confirming..." : "Placing Bid..."}
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-5 w-5 mr-1" />
                    Place Bid
                  </>
                )}
              </Button>
            </div>

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <Button className="w-full h-9 text-sm" disabled={timeLeft === 0}>
            {timeLeft === 0 ? "Auction Ended" : "Navigate to Passenger"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
