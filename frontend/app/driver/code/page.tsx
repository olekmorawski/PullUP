"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, AlertCircle } from "lucide-react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACT_ABI } from "@/abi";
import { CONTRACT_ADDRESS } from "@/address";

interface RideData {
  rideId: string;
  driver: string;
  passenger: string;
  timestamp: string;
}

const RideCompletePage = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rideCompleted, setRideCompleted] = useState<boolean>(false);
  const [rideData, setRideData] = useState<RideData | null>(null);

  // Read ride count
  const { data: rideCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "rideCount",
  });

  const currentRideId = rideCount ? Number(rideCount) - 1 : 0;

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

  const { writeContract, data: hash } = useWriteContract();

  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    const fetchRideData = async () => {
      setLoading(true);
      try {
        if (rideCore && !rideStatus?.[1]) {
          // if ride exists and not completed
          const data: RideData = {
            rideId: currentRideId.toString(),
            driver: address || "",
            passenger: rideCore[0],
            timestamp: new Date().toISOString(),
          };
          setRideData(data);
        }
      } catch (err) {
        console.error("Error fetching ride data:", err);
        setError("Failed to fetch ride data");
      } finally {
        setLoading(false);
      }
    };

    fetchRideData();
  }, [address, currentRideId, rideCore, rideStatus]);

  // Function to complete the ride
  const completeRide = async (scannedData: RideData) => {
    try {
      if (
        !scannedData.rideId ||
        !scannedData.driver ||
        !scannedData.passenger
      ) {
        throw new Error("Invalid QR code data");
      }

      // Call smart contract to complete the ride
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "completeRide",
        args: [BigInt(scannedData.rideId)],
      });

      setRideCompleted(true);
    } catch (err) {
      console.error("Error completing ride:", err);
      setError(err instanceof Error ? err.message : "Failed to complete ride");
    }
  };

  // Generate QR code data
  const qrCodeData = rideData
    ? JSON.stringify({
        type: "ride_completion",
        ...rideData,
        contractAddress: CONTRACT_ADDRESS,
      })
    : "";

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Ride Complete</CardTitle>
            {rideData && (
              <Badge variant="secondary" className="text-xs">
                Ride ID: {rideData.rideId}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {error ? (
              <div className="text-red-500 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            ) : rideCompleted ? (
              <div className="text-green-500 flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Ride completed successfully!</span>
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-center">
                  Show this QR code to your passenger to complete the ride
                </p>
                <div className="bg-white p-4 rounded-lg shadow-sm relative flex items-center justify-center">
                  {loading || isWaitingForTx ? (
                    <div className="w-64 h-64 flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    rideData && (
                      <QRCodeSVG
                        value={qrCodeData}
                        size={256}
                        level="H"
                        includeMargin={true}
                        title="Ride completion QR code"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                      />
                    )
                  )}
                </div>
                <div className="text-sm text-gray-500 text-center max-w-xs space-y-2">
                  <p>
                    This QR code has high error correction, making it scannable
                    even if partially obscured
                  </p>
                  <p className="text-xs">Ride ID: {rideData?.rideId}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideCompletePage;
