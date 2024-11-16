"use client";

import { useEffect, useState } from "react";
import {
  User,
  MapPin,
  CheckCircle,
  RefreshCw,
  Loader2,
  DollarSign,
  QrCode,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ABI } from "@/abi";
import { CONTRACT_ADDRESS } from "@/address";
import { useEthPrice } from "../page";
import { useRouter } from "next/navigation";

interface RideAuctionProps {
  rideId: bigint;
}

export default function PassengerAuction() {
  const { address } = useAccount();
  const ethPrice = useEthPrice();
  const router = useRouter();

  // Get total rides to find latest ride by the user
  const { data: rideCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "rideCount",
  });

  const currentRideId = rideCount ? Number(rideCount) - 1 : 0;

  return <RideAuction rideId={BigInt(currentRideId)} />;
}

function RideAuction({ rideId }: RideAuctionProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const ethPrice = useEthPrice();
  const router = useRouter();

  const handleGoToScanner = () => {
    router.push("/passenger/auction/scanner");
  };

  // Read ride details
  const { data: rideDetails } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRideDetails",
    args: [rideId],
  }) as { data: [string, string] };

  // Read ride core data
  const { data: rideCore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRideCore",
    args: [rideId],
  }) as { data: [string, bigint, bigint, bigint] };

  // Read ride status
  const { data: rideStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRideStatus",
    args: [rideId],
  }) as { data: [boolean, boolean, boolean, boolean, boolean, boolean] };

  // Read winning driver
  const { data: driverInfo } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDriverInfo",
    args: [rideId],
  }) as { data: string };

  // Contract write function to accept bid
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

  const handleAcceptBid = async () => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "acceptBid",
        args: [rideId],
      });
    } catch (err) {
      console.error("Error accepting bid:", err);
      setError(err instanceof Error ? err.message : "Failed to accept bid");
    }
  };

  const formatUsdPrice = (ethAmount: bigint | undefined) => {
    if (!ethAmount || !ethPrice) return "0.00";
    const ethValue = parseFloat(formatEther(ethAmount));
    return (ethValue * ethPrice).toFixed(2);
  };

  if (!parsedRideStatus?.active) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <div className="container max-w-2xl mx-auto p-4 h-full flex items-center justify-center">
          <Card className="w-full">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No active ride auction found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="container max-w-2xl mx-auto p-4">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Ride Auction</span>
              <span className="text-orange-500">{formatTime(timeLeft)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Pickup</p>
                    <p className="font-medium">
                      {parsedRideDetails?.pickupLocation}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Destination</p>
                    <p className="font-medium">
                      {parsedRideDetails?.destination}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Starting Bid</span>
                  <div className="text-right">
                    <span className="font-medium block">
                      ${formatUsdPrice(parsedRideCore?.startingBid)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ≈{" "}
                      {parsedRideCore
                        ? formatEther(parsedRideCore.startingBid)
                        : "0"}{" "}
                      ETH
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Current Bid</span>
                  <div className="text-right">
                    <span className="font-bold text-green-600 block">
                      ${formatUsdPrice(parsedRideCore?.currentBid)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ≈{" "}
                      {parsedRideCore
                        ? formatEther(parsedRideCore.currentBid)
                        : "0"}{" "}
                      ETH
                    </span>
                  </div>
                </div>
                {driverInfo && parsedRideStatus?.firstBidPlaced && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Current Driver
                      </span>
                    </div>
                    <span className="font-medium text-sm">
                      {`${driverInfo.slice(0, 6)}...${driverInfo.slice(-4)}`}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              {parsedRideStatus?.firstBidPlaced &&
                !parsedRideStatus?.bidAccepted && (
                  <Button
                    className="w-full"
                    onClick={handleAcceptBid}
                    disabled={isPending || isWaitingForTx}
                  >
                    {isPending || isWaitingForTx ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isPending ? "Confirming..." : "Accepting Bid..."}
                      </>
                    ) : (
                      "Accept Current Bid"
                    )}
                  </Button>
                )}

              {parsedRideStatus?.bidAccepted && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                    <CheckCircle className="h-5 w-5" />
                    <span>Bid Accepted</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleGoToScanner}
                    variant="secondary"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Show QR Code
                  </Button>
                </div>
              )}

              {/* Add button when auction ends without acceptance */}
              {timeLeft === 0 &&
                !parsedRideStatus?.bidAccepted &&
                parsedRideStatus?.firstBidPlaced && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-md">
                      <Clock className="h-5 w-5" />
                      <span>Auction Ended</span>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleGoToScanner}
                      variant="secondary"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Show QR Code
                    </Button>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        <div className="bg-white rounded-lg p-4 text-sm text-gray-500">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Auction updates automatically</span>
            </div>
            {ethPrice && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <DollarSign className="h-3 w-3" />
                <span>1 ETH = ${ethPrice.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
