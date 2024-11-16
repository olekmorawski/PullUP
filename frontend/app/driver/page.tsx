"use client";

import { useEffect, useState } from "react";
import { MapPin, User, ArrowDown, Loader2, Navigation, Check } from "lucide-react";
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
import { useRouter } from "next/navigation"; // Add this import

// Price fetching hook
const useEthPrice = () => {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching ETH price:", error);
        setIsLoading(false);
      }
    };

    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return { ethPrice, isLoading };
};

// Utility functions for formatting
const formatUSD = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatETH = (wei: bigint) => {
  return Number(formatEther(wei)).toFixed(6);
};

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
  const { ethPrice, isLoading: isLoadingPrice } = useEthPrice();
  const [usdBidAmount, setUsdBidAmount] = useState("");
  const router = useRouter();

  // Contract reads
  const { data: rideCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "rideCount",
  });

  const currentRideId = rideCount ? Number(rideCount) - 1 : 0;

  const { data: rideDetails } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRideDetails",
    args: [BigInt(currentRideId)],
  }) as { data: [string, string] };

  const { data: rideCore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRideCore",
    args: [BigInt(currentRideId)],
  }) as { data: [string, bigint, bigint, bigint] };

  const { data: rideStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRideStatus",
    args: [BigInt(currentRideId)],
  }) as { data: [boolean, boolean, boolean, boolean, boolean, boolean] };

  const { data: driverBid } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDriverBid",
    args: [BigInt(currentRideId), address as `0x${string}`],
  });

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

  const isWinningDriver =
    address &&
    parsedRideCore?.currentBid &&
    driverBid &&
    driverBid === parsedRideCore.currentBid;

  // Price conversion functions
  const ethToUsd = (ethAmount: bigint): number => {
    if (!ethPrice) return 0;
    const ethValue = Number(formatEther(ethAmount));
    return ethValue * ethPrice;
  };

  const usdToEth = (usdAmount: string): string => {
    if (!ethPrice || !usdAmount) return "";
    const usdValue = parseFloat(usdAmount);
    if (isNaN(usdValue)) return "";
    return (usdValue / ethPrice).toFixed(6);
  };

  // Timer update
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

  const handleUsdBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setUsdBidAmount(value);
      setBidAmount(usdToEth(value));
    }
  };

  const handlePlaceBid = async () => {
    try {
      if (!isConnected) {
        setError("Please connect your wallet");
        return;
      }

      if (!bidAmount || parseFloat(bidAmount) <= 0) {
        setError("Please enter a valid bid amount");
        return;
      }

      const bidInWei = parseEther(bidAmount);

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "placeBid",
        args: [BigInt(currentRideId), bidInWei],
      });

      setBidAmount("");
      setUsdBidAmount("");
      setError(null);
    } catch (err) {
      console.error("Error placing bid:", err);
      setError(err instanceof Error ? err.message : "Failed to place bid");
    }
  };

  const handleFinishRide = () => {
    router.push("/driver/code");
  };

  const handleNavigateToPassenger = () => {
    console.log("Navigating to passenger location...");
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

  if (timeLeft === 0 && !isWinningDriver) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <div className="flex-1 relative">
          <MapComponent />
        </div>
        <Card className="rounded-t-xl shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <p className="text-gray-600 font-medium">
                Searching for a passenger...
              </p>
            </div>
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

          {timeLeft > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Current Bid:</div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {parsedRideCore
                      ? formatUSD(ethToUsd(parsedRideCore.currentBid))
                      : "$0.00"}
                  </div>
                  <div className="text-xs text-gray-500">
                    ≈{" "}
                    {parsedRideCore
                      ? formatETH(parsedRideCore.currentBid)
                      : "0"}{" "}
                    ETH
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    type="text"
                    value={usdBidAmount}
                    onChange={handleUsdBidChange}
                    placeholder="USD"
                    className="pl-6 h-10 text-center"
                    disabled={isPending || isWaitingForTx}
                  />
                  {bidAmount && (
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      ≈ {bidAmount} ETH
                    </div>
                  )}
                </div>
                <Button
                  onClick={handlePlaceBid}
                  className="h-10 flex-1"
                  disabled={!bidAmount || isPending || isWaitingForTx}
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
          )}

          {timeLeft === 0 && isWinningDriver && (
            <div className="space-y-3">
              <Button
                onClick={handleNavigateToPassenger}
                className="w-full h-9 text-sm"
                variant="default"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate to Passenger
              </Button>

              <Button
                onClick={handleFinishRide}
                className="w-full h-9 text-sm"
                variant="secondary"
              >
                <Check className="h-4 w-4 mr-2" />
                Finish Ride
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
