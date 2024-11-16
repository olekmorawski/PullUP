"use client";

import React, { useState, useEffect } from "react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, AlertCircle, Camera } from "lucide-react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACT_ABI } from "@/abi";

interface RideData {
  type: string;
  rideId: string;
  driver: string;
  passenger: string;
  timestamp: string;
  contractAddress: string;
}

const RideScanPage = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { address } = useAccount();

  const { writeContract, data: hash } = useWriteContract();

  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash,
  });

  const handleScan = async (data: string | null) => {
    if (!data) return;

    try {
      const scannedData: RideData = JSON.parse(data);

      // Validate QR code data
      if (scannedData.type !== "ride_completion") {
        throw new Error("Invalid QR code type");
      }

      if (
        !scannedData.rideId ||
        !scannedData.driver ||
        !scannedData.passenger
      ) {
        throw new Error("Invalid QR code data");
      }

      // Verify the passenger is the one who booked the ride
      if (scannedData.passenger.toLowerCase() !== address?.toLowerCase()) {
        throw new Error("This ride belongs to a different passenger");
      }

      // Call smart contract to complete the ride
      await writeContract({
        address: scannedData.contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "completeRide",
        args: [BigInt(scannedData.rideId)],
      });

      setSuccess(true);
      setScanning(false);
    } catch (err) {
      console.error("Error processing QR code:", err);
      setError(
        err instanceof Error ? err.message : "Failed to process QR code"
      );
    }
  };

  const handleError = (err: Error) => {
    console.error("QR Scanner error:", err);
    setError("Failed to access camera. Please try again.");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Scan QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {error && (
              <div className="text-red-500 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="text-green-500 flex flex-col items-center gap-2">
                <Check className="w-8 h-8" />
                <span>Ride completed successfully!</span>
              </div>
            ) : scanning ? (
              <div className="w-full aspect-square relative">
                {isWaitingForTx ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <RefreshCw className="w-8 h-8 animate-spin text-white" />
                  </div>
                ) : null}
                <QrScanner
                  onDecode={handleScan}
                  onError={handleError}
                  containerStyle={{
                    borderRadius: "0.5rem",
                    overflow: "hidden",
                  }}
                />
              </div>
            ) : (
              <Button
                onClick={() => {
                  setScanning(true);
                  setError(null);
                }}
                className="w-full"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Scanning
              </Button>
            )}

            {scanning && !isWaitingForTx && (
              <Button
                variant="outline"
                onClick={() => {
                  setScanning(false);
                  setError(null);
                }}
              >
                Cancel Scanning
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideScanPage;
