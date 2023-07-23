import "dotenv/config";
import { createServer } from "node:http";
import { createRequestHandler } from "@remix-run/express";
import express from "express";
import { startLockWorker, stopLockWorker } from "~/worker";

const app = express();
const httpServer = createServer(app);

app.use(express.static("public"));

app.all(
  "*",
  process.env.NODE_ENV === "production"
    ? createRequestHandler({
        build: require("./build"),
        mode: "production",
      })
    : (req, res, next) => {
        purgeRequireCache("./build");

        return createRequestHandler({
          build: require("./build"),
          mode: "development",
        })(req, res, next);
      }
);

const port = process.env.PORT;

if (typeof port === "undefined") {
  console.error("PORT must be defined in the environment");
  process.exit(1);
}

httpServer.listen(process.env.PORT, () => {
  console.log("Express server started on port " + process.env.PORT);
  startLockWorker();
});

/**
 * On server shutdown, always remember to clean-up any
 * pending resources, including releasing the lock so
 * other nodes can pick them up.
 *
 * The lock has an auto-release period anyways, so worst case
 * it will expire and other nodes will pick it up, but
 * if you won't want to waste time, releasing the lock
 * will let other nodes do work more quickly.
 */

function gracefullyshutdown() {
  console.log("server shutting down");
  httpServer.close(() => {
    console.log("Will not accept incoming HTTP requests");
    // Stop our lock worker and only then exit
    stopLockWorker(() => {
      process.exit(0);
    });
  });
}
process.on("SIGTERM", gracefullyshutdown);
process.on("SIGINT", gracefullyshutdown);

/** Remix cache purging for HMR */
function purgeRequireCache(buildPath: string) {
  for (const key in require.cache) {
    if (key.startsWith(buildPath)) {
      console.log("purging", key);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete require.cache[key];
    }
  }
}
