"use client";
import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

// Define the type for our ride data
interface RideData {
  rideId: string;
  driverId: string;
  timestamp: string;
  status: string;
}

const RideCompletePage = () => {
  // Properly type the state
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate fetching ride data
    const generateRideData = () => {
      setLoading(true);

      // In a real app, this would come from your backend
      const mockRideData: RideData = {
        rideId: "RIDE_" + Math.random().toString(36).substr(2, 9),
        driverId: "DRIVER_123",
        timestamp: new Date().toISOString(),
        status: "completed",
      };

      setRideData(mockRideData);
      setLoading(false);
    };

    generateRideData();
  }, []);

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
            <p className="text-gray-600 text-center">
              Show this QR code to your passenger to complete the ride
            </p>

            <div className="bg-white p-4 rounded-lg shadow-sm relative flex items-center justify-center">
              {loading ? (
                <div className="w-64 h-64 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                rideData && (
                  <QRCodeSVG
                    value={JSON.stringify(rideData)}
                    size={256} // 256px x 256px
                    level="H" // Highest error correction
                    includeMargin={true}
                    title="Ride completion QR code"
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    imageSettings={{
                      src: "/api/placeholder/64/64", // You can add your company logo here
                      height: 24,
                      width: 24,
                      excavate: true,
                    }}
                  />
                )
              )}
            </div>

            <div className="text-sm text-gray-500 text-center max-w-xs space-y-2">
              <p>
                This QR code has high error correction, making it scannable even
                if partially obscured
              </p>
              <p className="text-xs">Ride ID: {rideData?.rideId}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideCompletePage;
