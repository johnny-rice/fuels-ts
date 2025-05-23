"use client";

import { FuelProvider, NetworkConfig } from "@fuels/react";
import React, { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { FuelConnector, Provider } from "fuels";
import { defaultConnectors } from "@fuels/connectors";

import { providerChainId, providerUrl } from "../lib";

import "react-toastify/dist/ReactToastify.css";
import "@/styles/globals.css";

const queryClient = new QueryClient();

const connectors: FuelConnector[] = defaultConnectors({
  devMode: true,
  fuelProvider: new Provider(providerUrl),
  chainId: providerChainId,
});

const networks: NetworkConfig[] = [{ url: providerUrl, chainId: providerChainId } as NetworkConfig];
interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only render the component if the page has been mounted.
  if (!isMounted) return null;

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <title>Fuel dApp</title>
      </head>
      <body>
        <React.StrictMode>
          <QueryClientProvider client={queryClient}>
            <FuelProvider
              theme="dark"
              fuelConfig={{ connectors }}
              uiConfig={{ suggestBridge: false }}
              networks={networks}
            >
              {" "}
              <ToastContainer theme="dark" />
              <>{children}</>
            </FuelProvider>
          </QueryClientProvider>
        </React.StrictMode>
      </body>
    </html>
  );
}
