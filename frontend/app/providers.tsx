"use client";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { createConfig, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import {
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  scrollSepolia,
  polygonAmoy,
  celoAlfajores,
  gnosisChiado,
  zircuitTestnet,
  mantleSepoliaTestnet,
} from "viem/chains";
import { ZeroDevSmartWalletConnectors } from "@dynamic-labs/ethereum-aa";

const config = createConfig({
  chains: [
    sepolia,
    baseSepolia,
    arbitrumSepolia,
    scrollSepolia,
    polygonAmoy,
    celoAlfajores,
    gnosisChiado,
    zircuitTestnet,
    mantleSepoliaTestnet,
  ],
  multiInjectedProviderDiscovery: false,
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [scrollSepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [celoAlfajores.id]: http(),
    [gnosisChiado.id]: http(),
    [zircuitTestnet.id]: http(),
    [mantleSepoliaTestnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: "729c292b-e35d-4bcd-bc2d-228ff8c89a45",
        walletConnectors: [
          EthereumWalletConnectors,
          ZeroDevSmartWalletConnectors,
        ],
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
