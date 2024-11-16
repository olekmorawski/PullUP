"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Lock, Wallet, User } from "lucide-react";
import {
  DynamicWidget,
  DynamicUserProfile,
  useDynamicContext,
} from "@dynamic-labs/sdk-react-core";
import { useEffect } from "react";

export default function Home() {
  const { setShowDynamicUserProfile, user } = useDynamicContext();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/menu");
    }
  }, [user, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full max-w-7xl mx-auto px-4 lg:px-8 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="#">
          <span className="sr-only">PullUP</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            How It Works
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            About
          </Link>
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDynamicUserProfile(true)}
            >
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Button>
          )}
        </nav>
      </header>

      <DynamicUserProfile variant="modal" />

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 w-full max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Ride the Future with PullUP
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Secure, transparent, and decentralized ride-sharing powered by
                  blockchain technology.
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                {user ? (
                  <Button onClick={() => setShowDynamicUserProfile(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Manage Wallet
                  </Button>
                ) : (
                  <DynamicWidget variant="modal" />
                )}
                <Button variant="outline">Learn More</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              Why Choose PullUP?
            </h2>
            <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
              <Card className="flex flex-col items-center text-center">
                <CardHeader>
                  <CardTitle>Secure Transactions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Lock className="h-12 w-12 mb-4" />
                  <p>
                    All payments are secured by blockchain technology, ensuring
                    trust and transparency.
                  </p>
                </CardContent>
              </Card>
              <Card className="flex flex-col items-center text-center">
                <CardHeader>
                  <CardTitle>Lower Fees</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <CreditCard className="h-12 w-12 mb-4" />
                  <p>
                    Enjoy reduced transaction fees thanks to our decentralized
                    platform.
                  </p>
                </CardContent>
              </Card>
              <Card className="flex flex-col items-center text-center">
                <CardHeader>
                  <CardTitle>Community Driven</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Wallet className="h-12 w-12 mb-4" />
                  <p>
                    Participate in governance and shape the future of
                    ride-sharing.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              How It Works
            </h2>
            <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
                <p className="max-w-sm">
                  Link your cryptocurrency wallet to get started with PullUP.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">Request a Ride</h3>
                <p className="max-w-sm">
                  Enter your destination and find a driver near you.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">Pay with Crypto</h3>
                <p className="max-w-sm">
                  Seamlessly pay for your ride using cryptocurrency.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-500 text-white">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Ride?
                </h2>
                <p className="mx-auto max-w-[700px] text-blue-100 md:text-xl">
                  Join the blockchain revolution in ride-sharing today.
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                {user ? (
                  <Button
                    variant="outline"
                    className="bg-white text-blue-500 hover:bg-blue-50"
                    onClick={() => setShowDynamicUserProfile(true)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Manage Wallet
                  </Button>
                ) : (
                  <DynamicWidget variant="modal" />
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2024 PullUP Inc. All rights reserved.
            </p>
            <nav className="flex gap-4 sm:gap-6" />
          </div>
        </div>
      </footer>
    </div>
  );
}
