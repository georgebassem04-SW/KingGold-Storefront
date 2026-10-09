/**
 * DATA SOURCE SWITCH — every page gets its data through `api` from this file.
 *   .env.local -> NEXT_PUBLIC_DATA_SOURCE=mock  : use the JSON files in mock-data/
 *   .env.local -> NEXT_PUBLIC_DATA_SOURCE=api   : use the real dashboard API (lib/api/http.ts)
 */
import { mockApi } from "./mock";
import { httpApi } from "./http";
import type { StorefrontApi } from "./types";

/** Switch between local mock data and the real dashboard API with one env variable */
export const api: StorefrontApi =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? httpApi : mockApi;

export type { StorefrontApi };
