// Local MongoDB for development, with no Docker or system install needed.
// The binary is downloaded into ./.mongodb-binaries and data is kept in ./.data/db
// (both gitignored). Point MONGODB_URI at the printed URI.
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server-core";

const port = Number(process.env.DEV_DB_PORT || 27017);
const dbPath = resolve(".data/db");
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port, dbPath, storageEngine: "wiredTiger" },
  binary: { downloadDir: resolve(".mongodb-binaries") },
});

console.log(`Dev MongoDB running: ${server.getUri()}review-booster`);
console.log("Press Ctrl+C to stop.");

const stop = async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
