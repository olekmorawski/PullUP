"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Car } from "lucide-react";

export default function MenuPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-100">
      <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to RideShare
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <Card className="hover:shadow-lg transition-shadow h-full">
            <CardContent className="p-6 flex flex-col items-center h-full">
              <div className="flex-1 flex flex-col items-center">
                <User className="h-12 w-12 mb-4 text-blue-500" />
                <h2 className="text-2xl font-semibold mb-4">Passenger</h2>
                <p className="text-gray-600 text-center">
                  Need a ride? Find drivers near you and get to your destination
                  safely.
                </p>
              </div>
              <div className="mt-6 w-full">
                <Button
                  className="w-full"
                  onClick={() => router.push("/passenger")}
                >
                  Ride Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow h-full">
            <CardContent className="p-6 flex flex-col items-center h-full">
              <div className="flex-1 flex flex-col items-center">
                <Car className="h-12 w-12 mb-4 text-green-500" />
                <h2 className="text-2xl font-semibold mb-4">Driver</h2>
                <p className="text-gray-600 text-center">
                  Ready to earn? Start accepting ride requests and make money on
                  your schedule.
                </p>
              </div>
              <div className="mt-6 w-full">
                <Button
                  className="w-full"
                  onClick={() => router.push("/driver")}
                >
                  Start Driving
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
