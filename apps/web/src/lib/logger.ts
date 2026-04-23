import pino from "pino";

// pino-pretty worker threads fail in Next.js dev due to module path issues.
// Use console transport for dev, default serialization for prod.
export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  base: { env: process.env.NODE_ENV, service: "mote-lab" },
});
