import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { ApiError } from "@/lib/server/api/errors"

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function fail(
  status: number,
  error: string,
  details?: unknown,
) {
  return NextResponse.json(
    details === undefined ? { error } : { error, details },
    { status },
  )
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return fail(err.status, err.message, err.details)
  }
  if (err instanceof ZodError) {
    return fail(400, "Validation failed", err.flatten())
  }
  if (err instanceof Error) {
    return fail(500, err.message)
  }
  return fail(500, "Unknown server error")
}
