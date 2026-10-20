/**
 * CLIENT LIST
 * ------------------------------------------------------------------
 * Every client's settings file must be registered here.
 * The site loads the client whose id is in .env.local -> NEXT_PUBLIC_CLIENT_ID.
 * If that id isn't found, the demo client is used.
 *
 * To add a client:
 *   1. import { gemmaClient } from "./gemma";
 *   2. add   gemma: gemmaClient,   inside `clients` below
 *   3. set   NEXT_PUBLIC_CLIENT_ID=gemma   in .env.local
 */
import type { ClientConfig } from "@/types";
import { demoClient } from "./demo";
import { kingGoldClient } from "./king-gold";

const clients: Record<string, ClientConfig> = {
  demo: demoClient,
  "king-gold": kingGoldClient,
  // gemma: gemmaClient,
};

const activeId = process.env.NEXT_PUBLIC_CLIENT_ID ?? "demo";

// Every other file imports `clientConfig` to read the active client's settings
export const clientConfig: ClientConfig = clients[activeId] ?? demoClient;
