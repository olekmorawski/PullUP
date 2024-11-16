'use client'

import { Car, Bike, Truck, RotateCcw } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function VehicleTypeSelector() {
  const vehicles = [
    {
      icon: <Car className="h-6 w-6" />,
      name: "Car",
      pickupTime: "2 min",
      travelTime: "15 min"
    },
    {
      icon: <Bike className="h-6 w-6" />,
      name: "Bike",
      pickupTime: "3 min",
      travelTime: "20 min"
    },
    {
      icon: <RotateCcw className="h-6 w-6" />,
      name: "Tuktuk",
      pickupTime: "4 min",
      travelTime: "25 min"
    },
    {
      icon: <Truck className="h-6 w-6" />,
      name: "Van",
      pickupTime: "5 min",
      travelTime: "30 min"
    }
  ]

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow">
      <div className="p-4 space-y-4">
        {vehicles.map((vehicle, index) => (
          <button
            key={vehicle.name}
            className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border border-gray-100 rounded-lg`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-gray-600">
                {vehicle.icon}
              </div>
              <div>
                <div className="font-medium">{vehicle.name}</div>
                <div className="text-sm text-gray-500">Pickup in {vehicle.pickupTime}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Est. travel time</div>
              <div className="font-medium">{vehicle.travelTime}</div>
            </div>
          </button>
        ))}
        
        <div className="mt-6">
          <label htmlFor="offer" className="block text-sm font-medium text-gray-700 mb-1">
            Your offer:
          </label>
          <Input
            type="number"
            id="offer"
            placeholder="Enter your price"
            className="w-full"
          />
        </div>
        
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white mt-4">
          Order Ride
        </Button>
      </div>
    </div>
  )
}