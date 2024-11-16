"use client";

import React, { useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
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

  const startScanning = () => {
    setScanning(true);
    setError(null);

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    scanner.render(handleScan, handleError);

    // Store scanner instance for cleanup
    (window as any).qrScanner = scanner;
  };

  const stopScanning = () => {
    if ((window as any).qrScanner) {
      (window as any).qrScanner.clear();
    }
    setScanning(false);
  };

  const handleScan = async (decodedText: string) => {
    try {
      const scannedData: RideData = JSON.parse(decodedText);

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

      // Stop scanning after successful read
      stopScanning();

      // Call smart contract to complete the ride
      await writeContract({
        address: scannedData.contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "completeRide",
        args: [BigInt(scannedData.rideId)],
      });

      setSuccess(true);
    } catch (err) {
      console.error("Error processing QR code:", err);
      setError(
        err instanceof Error ? err.message : "Failed to process QR code"
      );
      stopScanning();
    }
  };

  const handleError = (err: any) => {
    console.error("QR Scanner error:", err);
    setError("Failed to access camera. Please try again.");
    stopScanning();
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
            ) : (
              <>
                <div id="qr-reader" className="w-full"></div>
                {!scanning ? (
                  <Button
                    onClick={startScanning}
                    className="w-full"
                    disabled={isWaitingForTx}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={stopScanning}
                    className="w-full"
                    disabled={isWaitingForTx}
                  >
                    Stop Scanning
                  </Button>
                )}
              </>
            )}

            {isWaitingForTx && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Completing ride...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideScanPage;
