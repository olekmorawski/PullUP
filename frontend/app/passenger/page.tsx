"use client";
import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  ChevronUp,
  ChevronDown,
  Search,
  Navigation,
  Wallet,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  useAccount,
  useBalance,
  useConnect,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits, erc20Abi, parseUnits } from "viem";
import { CONTRACT_ABI } from "@/abi";
import { CONTRACT_ADDRESS } from "@/address";

const COMMON_TOKENS = [
  {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
  },
  {
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
  {
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  {
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
  },
] as const;

interface Token {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  address: string;
}

const useTokenBalance = (
  tokenAddress: `0x${string}`,
  userAddress: `0x${string}` | undefined
) => {
  const { data, isError, isLoading } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
  });

  return { data, isError, isLoading };
};

export const useEthPrice = () => {
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (error) {
        console.error("Failed to fetch ETH price:", error);
      }
    };

    fetchEthPrice();
    // Refresh price every minute
    const interval = setInterval(fetchEthPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return ethPrice;
};

export default function Passenger() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [destination, setDestination] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [customPrice, setCustomPrice] = useState("");
  const [pickupType, setPickupType] = useState("current");
  const [customPickupAddress, setCustomPickupAddress] = useState("");
  const [customPickupTime, setCustomPickupTime] = useState("");
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>("");
  const [usdPrice, setUsdPrice] = useState("");
  const ethPrice = useEthPrice();
  const router = useRouter();

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: ethBalance, isLoading: isLoadingEth } = useBalance({
    address,
  });

  // Individual token balance hooks
  const { data: usdtBalance, isLoading: isLoadingUsdt } = useTokenBalance(
    COMMON_TOKENS[1].address as `0x${string}`,
    address
  );
  const { data: usdcBalance, isLoading: isLoadingUsdc } = useTokenBalance(
    COMMON_TOKENS[2].address as `0x${string}`,
    address
  );
  const { data: wbtcBalance, isLoading: isLoadingWbtc } = useTokenBalance(
    COMMON_TOKENS[3].address as `0x${string}`,
    address
  );

  useEffect(() => {
    if (
      !address ||
      isLoadingEth ||
      isLoadingUsdt ||
      isLoadingUsdc ||
      isLoadingWbtc
    )
      return;

    const updatedTokens: Token[] = [];

    if (ethBalance) {
      updatedTokens.push({
        symbol: "ETH",
        name: "Ethereum",
        balance: ethBalance.formatted,
        decimals: 18,
        address: "0x0000000000000000000000000000000000000000",
      });
    }

    // Add other tokens if they have balances
    const tokenBalances = [
      { balance: usdtBalance, token: COMMON_TOKENS[1] },
      { balance: usdcBalance, token: COMMON_TOKENS[2] },
      { balance: wbtcBalance, token: COMMON_TOKENS[3] },
    ];

    tokenBalances.forEach(({ balance, token }) => {
      if (balance !== undefined) {
        updatedTokens.push({
          symbol: token.symbol,
          name: token.name,
          balance: formatUnits(balance, token.decimals),
          decimals: token.decimals,
          address: token.address,
        });
      }
    });

    setTokens(updatedTokens);
    if (!selectedToken && updatedTokens.length > 0) {
      setSelectedToken(updatedTokens[0]);
    }
  }, [
    address,
    ethBalance,
    usdtBalance,
    usdcBalance,
    wbtcBalance,
    isLoadingEth,
    isLoadingUsdt,
    isLoadingUsdc,
    isLoadingWbtc,
    selectedToken,
  ]);

  const handleCreateRide = async () => {
    setError(null);
    setTxStatus("");

    if (!isConnected) {
      connect({ connector: connectors[0] });
      return;
    }

    try {
      if (!destination) {
        setError("Please enter a destination");
        return;
      }

      if (pickupType === "custom" && !customPickupAddress) {
        setError("Please enter a pickup address");
        return;
      }

      if (pickupType === "scheduled" && !customPickupTime) {
        setError("Please enter a pickup time");
        return;
      }

      if (!customPrice || parseFloat(customPrice) <= 0) {
        setError("Please enter a valid price");
        return;
      }

      const pickupLocation =
        pickupType === "current"
          ? "Current Location"
          : pickupType === "scheduled"
          ? `Scheduled: ${customPickupTime}`
          : customPickupAddress;

      // Convert price to wei if using ETH
      const startingBid = parseUnits(
        customPrice,
        selectedToken?.decimals || 18
      );

      setTxStatus("Creating ride request...");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "createRide",
        args: [pickupLocation, destination, startingBid],
      });
    } catch (error) {
      console.error("Error creating ride:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create ride"
      );
    }
  };

  // Effect to handle transaction status
  useEffect(() => {
    if (isPending) {
      setTxStatus("Confirming transaction...");
    } else if (isWaitingForTx) {
      setTxStatus("Waiting for confirmation...");
    } else if (hash) {
      setTxStatus("Ride created successfully!");
      // Add redirect after successful transaction
      setTimeout(() => {
        setTxStatus("");
        router.push("/passenger/auction"); // Redirect to auction page
      }, 2000); // Redirect after 2 seconds to allow user to see success message
    }
  }, [hash, isPending, isWaitingForTx, router]);

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
      setUsdPrice(value);
      if (ethPrice && value !== "") {
        const ethAmount = (parseFloat(value) / ethPrice).toFixed(6);
        setCustomPrice(ethAmount);
      } else {
        setCustomPrice("");
      }
    }
  };

  useEffect(() => {
    if (destination) {
      const simulatedUsdPrice = Math.floor(Math.random() * 30) + 20; // $20-50 range
      setSuggestedPrice(simulatedUsdPrice);
      setUsdPrice(simulatedUsdPrice.toString());
      if (ethPrice) {
        const ethAmount = (simulatedUsdPrice / ethPrice).toFixed(6);
        setCustomPrice(ethAmount);
      }
    } else {
      setSuggestedPrice(0);
      setUsdPrice("");
      setCustomPrice("");
    }
  }, [destination, ethPrice]);

  const handleRequestRide = async () => {
    setError(null);
    setTxStatus("");

    if (!isConnected) {
      connect({ connector: connectors[0] });
      return;
    }

    try {
      // Validate all required fields
      if (!destination) {
        setError("Please enter a destination");
        return;
      }

      if (pickupType === "custom" && !customPickupAddress) {
        setError("Please enter a pickup address");
        return;
      }

      if (pickupType === "scheduled" && !customPickupTime) {
        setError("Please enter a pickup time");
        return;
      }

      // Validate price is set
      if (!customPrice || parseFloat(customPrice) <= 0) {
        setError("Please enter a valid price");
        return;
      }

      // Validate token is selected
      if (!selectedToken) {
        setError("Please select a payment token");
        return;
      }

      const pickupLocation =
        pickupType === "current"
          ? "Current Location"
          : pickupType === "scheduled"
          ? `Scheduled: ${customPickupTime}`
          : customPickupAddress;

      // Convert price to wei
      const startingBid = parseUnits(customPrice, selectedToken.decimals);

      setTxStatus("Creating ride request...");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "createRide",
        args: [pickupLocation, destination, startingBid],
      });
    } catch (error) {
      console.error("Error creating ride:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create ride"
      );
    }
  };

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setShowTokenModal(false);
    console.log(`Selected token for payment:`, token);
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

          <div className={`mt-6 ${isExpanded ? "" : "hidden"}`}>
            <div className="space-y-4">
              <RadioGroup
                value={pickupType}
                onValueChange={setPickupType}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="current" id="current" />
                  <Label htmlFor="current" className="flex items-center">
                    <Navigation className="h-4 w-4 mr-2" />
                    Current Location
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Custom Location
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule for Later
                  </Label>
                </div>
              </RadioGroup>

              {pickupType === "custom" && (
                <div>
                  <Label
                    htmlFor="pickup-address"
                    className="text-sm font-medium block mb-1"
                  >
                    Pickup Address
                  </Label>
                  <Input
                    id="pickup-address"
                    placeholder="Enter pickup address"
                    value={customPickupAddress}
                    onChange={(e) => setCustomPickupAddress(e.target.value)}
                  />
                </div>
              )}

              {pickupType === "scheduled" && (
                <div>
                  <Label
                    htmlFor="pickup-time"
                    className="text-sm font-medium block mb-1"
                  >
                    Pickup Time
                  </Label>
                  <Input
                    id="pickup-time"
                    type="datetime-local"
                    value={customPickupTime}
                    onChange={(e) => setCustomPickupTime(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Label
              htmlFor="destination"
              className="text-sm font-medium block mb-1"
            >
              Where to?
            </Label>
            <Input
              id="destination"
              placeholder="Enter your destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="pr-10"
            />
            <Search className="h-4 w-4 absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {destination && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Suggested Price:</span>
                <div className="text-right">
                  <span className="font-semibold block">
                    ${suggestedPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ≈ {ethPrice && (suggestedPrice / ethPrice).toFixed(6)} ETH
                  </span>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="custom-price"
                  className="text-sm font-medium block mb-1"
                >
                  Your Offer:
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-3 flex items-center gap-1"
                    onClick={() => {
                      if (isConnected) {
                        setShowTokenModal(true);
                      } else {
                        connect({ connector: connectors[0] });
                      }
                    }}
                  >
                    <Wallet className="h-4 w-4 mr-1" />
                    {selectedToken ? selectedToken.symbol : "Connect"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <div className="relative flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        id="custom-price"
                        type="text"
                        value={usdPrice}
                        onChange={handleCustomPriceChange}
                        className="h-10 pl-6"
                        placeholder="Enter USD amount"
                      />
                    </div>
                    {usdPrice && ethPrice && (
                      <div className="text-xs text-gray-500 mt-1">
                        ≈ {(parseFloat(usdPrice) / ethPrice).toFixed(6)} ETH
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {txStatus && (
            <div className="mt-4 p-2 bg-blue-50 text-blue-700 rounded-md text-sm">
              {txStatus}
            </div>
          )}

          {destination && (
            <Button
              className="w-full mt-4"
              onClick={handleRequestRide}
              disabled={!customPrice || isPending || isWaitingForTx}
            >
              {!isConnected ? (
                "Connect Wallet"
              ) : isPending || isWaitingForTx ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {txStatus}
                </div>
              ) : (
                "Create Ride Request"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>Select Token</DialogTitle>
          </DialogHeader>
          <Command className="border-0">
            <CommandInput placeholder="Search tokens..." className="border-b" />
            <CommandList className="max-h-[300px]">
              <CommandGroup>
                {isLoadingEth ||
                isLoadingUsdt ||
                isLoadingUsdc ||
                isLoadingWbtc ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Loading tokens...
                  </div>
                ) : (
                  tokens.map((token) => (
                    <CommandItem
                      key={token.address}
                      onSelect={() => handleTokenSelect(token)}
                      className="flex items-center justify-between py-2 px-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium min-w-[50px]">
                          {token.symbol}
                        </span>
                        <span className="text-sm text-gray-600">
                          {token.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {parseFloat(token.balance).toFixed(4)}
                        </span>
                        {selectedToken?.address === token.address && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}
