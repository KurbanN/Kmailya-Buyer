import type { NextRequest } from "next/server"

import { ApiError } from "@/lib/server/api/errors"

export function extractBearerToken(request: NextRequest): string {
  const header = request.headers.get("authorization") ?? ""
  const [scheme, token] = header.split(" ")

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new ApiError(401, "Missing or invalid bearer token")
  }
  return token
}
