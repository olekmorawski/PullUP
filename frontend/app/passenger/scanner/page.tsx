"use client";
import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle2, XCircle } from "lucide-react";

// Define interfaces for our types
interface RideData {
  rideId: string;
  driverId: string;
  timestamp: string;
  status: string;
}

interface Scanner extends Html5QrcodeScanner {
  clear: () => Promise<void>;
}

const ScanCompletionPage = () => {
  const [scanResult, setScanResult] = useState<RideData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanner, setScanner] = useState<Scanner | null>(null);

  useEffect(() => {
    // Cleanup function
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanner]);

  const startScanning = () => {
    try {
      const qrScanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        false // Don't start scanning immediately
      ) as Scanner;

      qrScanner.render(onScanSuccess, onScanError);
      setScanner(qrScanner);
      setScanning(true);
      setError(null);
    } catch (err) {
      setError(
        "Failed to start camera. Please ensure you've granted camera permissions."
      );
      console.error("Error starting scanner:", err);
    }
  };

  const onScanSuccess = (decodedText: string) => {
    try {
      const rideData = JSON.parse(decodedText) as RideData;

      // Basic validation of the QR code data
      if (!rideData.rideId || !rideData.driverId || !rideData.timestamp) {
        throw new Error("Invalid QR code format");
      }

      // In a real app, you would validate this with your backend
      setScanResult(rideData);
      setScanning(false);

      // Clean up the scanner after successful scan
      if (scanner) {
        scanner.clear().catch(console.error);
        setScanner(null);
      }

      // Mock API call to your backend
      console.log("Confirming ride completion:", rideData);
    } catch (err) {
      setError("Invalid QR code format. Please try scanning again.");
      console.error("Error processing QR code:", err);
    }
  };

  const onScanError = (err: string) => {
    // Only show errors that matter to the user
    if (err?.includes("NoCameraAccessError")) {
      setError("Please grant camera permission to scan the QR code.");
      setScanning(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setScanning(false);
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              Scan Completion Code
            </CardTitle>
            {scanning && (
              <Badge variant="secondary" className="animate-pulse">
                Scanning...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            {!scanning && !scanResult && (
              <Button
                onClick={startScanning}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>Start Scanner</span>
              </Button>
            )}

            {scanning && (
              <div className="w-full space-y-4">
                <div id="qr-reader" className="w-full" />
                <Button
                  variant="outline"
                  onClick={resetScanner}
                  className="w-full"
                >
                  Cancel Scanning
                </Button>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {scanResult && (
              <div className="w-full space-y-4">
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">
                    Ride completed successfully!
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="flex justify-between">
                    <span className="text-gray-600">Ride ID:</span>
                    <span className="font-medium">{scanResult.rideId}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Driver ID:</span>
                    <span className="font-medium">{scanResult.driverId}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span className="font-medium">
                      {new Date(scanResult.timestamp).toLocaleString()}
                    </span>
                  </p>
                </div>

                <Button onClick={resetScanner} className="w-full">
                  Scan Another Code
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanCompletionPage;
