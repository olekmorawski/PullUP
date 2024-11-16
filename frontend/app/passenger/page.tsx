"use client";
import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  ChevronUp,
  ChevronDown,
  Search,
  Navigation,
  DollarSign,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MapComponent } from "@/components/MapComponent";

const exchangeRates = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.14,
  AUD: 1.34,
  CAD: 1.25,
  CHF: 0.92,
  CNY: 6.47,
  INR: 74.38,
  MXN: 20.05,
};

export default function Passenger() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [destination, setDestination] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [customPrice, setCustomPrice] = useState("");
  const [pickupType, setPickupType] = useState("current");
  const [customPickupAddress, setCustomPickupAddress] = useState("");
  const [customPickupTime, setCustomPickupTime] = useState("");
  const [userMode, setUserMode] = useState<"passenger" | "driver">("passenger");
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  const recentLocations = [
    "Work - 123 Business St",
    "Home - 456 Home Ave",
    "Gym - 789 Fitness Blvd",
  ];

  const currencies = [
    { code: "USD", name: "US Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "British Pound" },
    { code: "JPY", name: "Japanese Yen" },
    { code: "AUD", name: "Australian Dollar" },
    { code: "CAD", name: "Canadian Dollar" },
    { code: "CHF", name: "Swiss Franc" },
    { code: "CNY", name: "Chinese Yuan" },
    { code: "INR", name: "Indian Rupee" },
    { code: "MXN", name: "Mexican Peso" },
  ];

  useEffect(() => {
    if (destination) {
      const simulatedPrice = Math.floor(Math.random() * 20) + 10;
      setSuggestedPrice(simulatedPrice);
      setCustomPrice(simulatedPrice.toString());
    } else {
      setSuggestedPrice(0);
      setCustomPrice("");
    }
  }, [destination]);

  const handleCustomPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setCustomPrice(value);
    }
  };

  const handleRequestRide = () => {
    if (userMode === "passenger") {
      setShowCurrencyModal(true);
    } else {
      console.log("Starting trip as driver");
    }
  };

  const handleCurrencySelect = (currency: string) => {
    setSelectedCurrency(currency);
    setShowCurrencyModal(false);
    console.log(`Requesting ride with currency: ${currency}`);
  };

  const convertCurrency = (amount: number, toCurrency: string) => {
    const rate = exchangeRates[toCurrency as keyof typeof exchangeRates];
    return (amount * rate).toFixed(2);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 relative">
        <MapComponent />
      </div>

      <Card className="rounded-t-xl shadow-lg relative">
        <CardContent className="p-4 pb-6">
          <button
            className="absolute top-0 left-1/2 -translate-x-1/2 p-2 rounded-full hover:bg-gray-100"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-6 w-6" />
            ) : (
              <ChevronUp className="h-6 w-6" />
            )}
          </button>

          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder={
                  userMode === "passenger"
                    ? "Where to?"
                    : "Set your destination"
                }
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-3">
              <div>
                <h3 className="text-sm font-medium mb-2">Recent Locations</h3>
                <div className="space-y-1">
                  {recentLocations.map((location, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded-md flex items-center"
                      onClick={() => setDestination(location)}
                    >
                      <Navigation className="h-4 w-4 mr-2 text-gray-500" />
                      {location}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-sm font-medium">
                  {userMode === "passenger"
                    ? "Pickup Location"
                    : "Starting Location"}
                </Label>
                <RadioGroup
                  value={pickupType}
                  onValueChange={setPickupType}
                  className="space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="current" id="current-location" />
                    <Label htmlFor="current-location" className="text-sm">
                      Current Location
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom-location" />
                    <Label htmlFor="custom-location" className="text-sm">
                      Custom Location
                    </Label>
                  </div>
                </RadioGroup>

                {pickupType === "custom" && (
                  <Input
                    type="text"
                    value={customPickupAddress}
                    onChange={(e) => setCustomPickupAddress(e.target.value)}
                    placeholder="Enter address"
                    className="h-10"
                  />
                )}

                <div>
                  <Label
                    htmlFor="pickup-time"
                    className="text-sm font-medium block mb-1"
                  >
                    {userMode === "passenger"
                      ? "Pickup Time"
                      : "Departure Time"}
                  </Label>
                  <Input
                    id="pickup-time"
                    type="time"
                    value={customPickupTime}
                    onChange={(e) => setCustomPickupTime(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {destination && userMode === "passenger" && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Suggested Price:</span>
                <span className="font-semibold">
                  ${suggestedPrice.toFixed(2)}
                </span>
              </div>
              <div>
                <Label
                  htmlFor="custom-price"
                  className="text-sm font-medium block mb-1"
                >
                  Your Offer:
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="custom-price"
                    type="text"
                    value={customPrice}
                    onChange={handleCustomPriceChange}
                    className="pl-9 h-10"
                    placeholder="Enter your price"
                  />
                </div>
              </div>
            </div>
          )}

          {destination && (
            <div className="mt-4 pt-3 space-y-2 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 shrink-0" />
                <span>Estimated arrival: 5 mins</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">
                  {pickupType === "current"
                    ? "Current location"
                    : customPickupAddress || "Not set"}
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 sticky bottom-0 left-0 right-0 bg-white pt-2">
            <Button
              className="w-full h-10 shadow-none"
              onClick={handleRequestRide}
              disabled={
                !destination ||
                (userMode === "passenger" && !customPrice) ||
                (pickupType === "custom" && !customPickupAddress)
              }
            >
              {userMode === "passenger" ? "Request Ride" : "Start Trip"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCurrencyModal} onOpenChange={setShowCurrencyModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Choose Payment Currency</DialogTitle>
            <DialogDescription>
              Select the currency you'd like to use for payment.
            </DialogDescription>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Search currencies..." />
            <CommandList>
              <CommandEmpty>No currencies found.</CommandEmpty>
              <CommandGroup>
                {currencies.map((currency) => (
                  <CommandItem
                    key={currency.code}
                    onSelect={() => handleCurrencySelect(currency.code)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedCurrency === currency.code
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    <span>
                      {currency.name} ({currency.code})
                    </span>
                    <span className="ml-auto text-sm text-gray-500">
                      {currency.code === "USD"
                        ? `$${customPrice}`
                        : `${currency.code} ${convertCurrency(
                            parseFloat(customPrice),
                            currency.code
                          )}`}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <DialogFooter>
            <Button onClick={() => setShowCurrencyModal(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
