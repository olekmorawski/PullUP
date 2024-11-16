"use client";

import React, { useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
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

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // QR Code scanned successfully
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
            if (
              scannedData.passenger.toLowerCase() !== address?.toLowerCase()
            ) {
              throw new Error("This ride belongs to a different passenger");
            }

            // Stop scanning
            await html5QrCode.stop();
            setScanning(false);

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
            await html5QrCode.stop();
            setScanning(false);
          }
        },
        (errorMessage) => {
          // QR Code scanning failed
          console.log(errorMessage);
        }
      );

      setScanning(true);
      setError(null);
    } catch (err) {
      console.error("Failed to start scanner:", err);
      setError(
        "Failed to start camera. Please make sure you've granted camera permissions."
      );
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      await html5QrCode.stop();
      setScanning(false);
    } catch (err) {
      console.error("Failed to stop scanner:", err);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scanning) {
        stopScanning();
      }
    };
  }, [scanning]);

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
                <div id="qr-reader" className="w-full max-w-sm">
                  {/* Camera feed will be inserted here */}
                </div>

                <Button
                  onClick={scanning ? stopScanning : startScanning}
                  className="w-full"
                  disabled={isWaitingForTx}
                  variant={scanning ? "outline" : "default"}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  {scanning ? "Stop Scanning" : "Start Scanning"}
                </Button>
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

      {/* Add some CSS to help with the camera view */}
      <style jsx global>{`
        #qr-reader video {
          border-radius: 0.5rem;
          width: 100% !important;
        }
        #qr-reader {
          border: none !important;
          width: 100% !important;
        }
        #qr-reader__status_span {
          display: none;
        }
        #qr-reader__dashboard_section_csr button {
          padding: 8px 16px;
          background: #0ea5e9;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default RideScanPage;
