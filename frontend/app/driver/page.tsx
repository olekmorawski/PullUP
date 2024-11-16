"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  User,
  DollarSign,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapComponent } from "@/components/MapComponent";

export default function Driver() {
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(25.0);
  const [bidAmount, setBidAmount] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimer((timer) => timer + 1);
      }, 1000);
    } else if (!isActive && timer !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timer]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleBid = (type: "lower" | "higher") => {
    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue)) return;

    if (type === "lower") {
      setCurrentPrice(Math.max(currentPrice - bidValue, 0));
    } else {
      setCurrentPrice(currentPrice + bidValue);
    }
    setBidAmount("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 relative">
        <MapComponent />
      </div>

      <Card className="rounded-t-xl shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center">
              <Navigation className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">To passenger</p>
                <p className="text-sm font-semibold">2.5 miles</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-green-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Trip length</p>
                <p className="text-sm font-semibold">7.8 miles</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-orange-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">To pickup</p>
                <p className="text-sm font-semibold">8 mins</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Trip time</p>
                <p className="text-sm font-semibold">22 mins</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm font-semibold">John Doe</span>
            </div>
            <div className="text-xl font-bold">{formatTime(timer)}</div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Current Price:</div>
              <div className="text-lg font-bold text-green-600">
                ${currentPrice.toFixed(2)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="bid-amount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="$"
                className="h-10 w-24 text-center"
              />
              <div className="flex gap-1 flex-1">
                <Button
                  onClick={() => handleBid("lower")}
                  className="h-10 flex-1"
                  disabled={!bidAmount}
                >
                  <ArrowDown className="h-5 w-5 mr-1" />
                  Lower
                </Button>
                <Button
                  onClick={() => handleBid("higher")}
                  className="h-10 flex-1"
                  disabled={!bidAmount}
                >
                  <ArrowUp className="h-5 w-5 mr-1" />
                  Higher
                </Button>
              </div>
            </div>
          </div>

          <Button className="w-full h-9 text-sm">Navigate to Passenger</Button>
        </CardContent>
      </Card>
    </div>
  );
}
