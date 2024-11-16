"use client";

import { useState } from "react";
import {
  Camera,
  Car,
  ChevronLeft,
  Bike,
  Truck,
  Fuel,
  Zap,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProfileCreation() {
  const [isDriver, setIsDriver] = useState(false);
  const [country, setCountry] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button className="flex items-center text-gray-600">
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </button>
          <h1 className="text-xl font-semibold">Profile</h1>
        </div>

        <div className="flex justify-center space-x-4 mb-6">
          <Button
            variant={isDriver ? "outline" : "default"}
            className="w-1/2"
            onClick={() => setIsDriver(false)}
          >
            Passenger
          </Button>
          <Button
            variant={isDriver ? "default" : "outline"}
            className="w-1/2"
            onClick={() => setIsDriver(true)}
          >
            Driver
          </Button>
        </div>

        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="w-full h-full rounded-full bg-gray-200" />
          <button className="absolute bottom-0 right-0 p-2 bg-green-600 rounded-full text-white">
            <Camera className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" placeholder="Enter your full name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex">
              <Select defaultValue="+66">
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="BKK" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+66">
                    <span className="flex items-center">
                      <span className="ml-2">+66 BKK</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="flex-1 ml-2"
                id="phone"
                placeholder="Your mobile number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={country ?? ""} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thailand">Thailand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Select disabled={!country}>
              <SelectTrigger>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sukhumvit">Sukhumvit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isDriver && (
            <Card className="mt-6">
              <CardContent className="pt-6 space-y-4">
                <h2 className="text-lg font-semibold mb-4">Car Details</h2>

                <div className="space-y-2">
                  <Label htmlFor="transportType">Type of Transport</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transport type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">
                        <span className="flex items-center">
                          <Car className="mr-2 h-4 w-4" />
                          Car
                        </span>
                      </SelectItem>
                      <SelectItem value="bike">
                        <span className="flex items-center">
                          <Bike className="mr-2 h-4 w-4" />
                          Bike
                        </span>
                      </SelectItem>
                      <SelectItem value="tuktuk">
                        <span className="flex items-center">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Tuktuk
                        </span>
                      </SelectItem>
                      <SelectItem value="van">
                        <span className="flex items-center">
                          <Truck className="mr-2 h-4 w-4" />
                          Van
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration">
                    Vehicle Registration Number
                  </Label>
                  <Input
                    id="registration"
                    placeholder="Enter registration number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" placeholder="Enter vehicle brand" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" placeholder="Enter vehicle model" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" placeholder="Enter vehicle color" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diesel">
                        <span className="flex items-center">
                          <Fuel className="mr-2 h-4 w-4" />
                          Diesel
                        </span>
                      </SelectItem>
                      <SelectItem value="electric">
                        <span className="flex items-center">
                          <Zap className="mr-2 h-4 w-4" />
                          Electric
                        </span>
                      </SelectItem>
                      <SelectItem value="gasoline">
                        <span className="flex items-center">
                          <Fuel className="mr-2 h-4 w-4" />
                          Gasoline
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4 mt-6">
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
