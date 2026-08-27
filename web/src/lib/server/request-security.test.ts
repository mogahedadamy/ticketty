import { describe, expect, it } from "vitest";
import {
  hasTrustedOrigin,
  jwtRemainingSeconds,
  requestIdFrom,
} from "./request-security";

function unsignedToken(payload: object): string {
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;
}

describe("request security helpers", () => {
  it("preserves safe request IDs and replaces unsafe values", () => {
    expect(requestIdFrom(new Headers({ "x-request-id": "edge-123" }))).toBe(
      "edge-123",
    );
    expect(
      requestIdFrom(new Headers({ "x-request-id": "unsafe value" })),
    ).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("accepts only the configured mutation origin", () => {
    expect(
      hasTrustedOrigin(
        new Request("https://app.example.com/api", {
          headers: { origin: "https://app.example.com" },
        }),
        "https://app.example.com",
      ),
    ).toBe(true);
    expect(
      hasTrustedOrigin(
        new Request("https://app.example.com/api"),
        "https://app.example.com",
      ),
    ).toBe(false);
  });

  it("derives cookie lifetime from a valid future JWT expiry", () => {
    expect(jwtRemainingSeconds(unsignedToken({ exp: 1_100 }), 1_000)).toBe(100);
    expect(jwtRemainingSeconds(unsignedToken({ exp: 999 }), 1_000)).toBeNull();
    expect(jwtRemainingSeconds("malformed", 1_000)).toBeNull();
  });
});
