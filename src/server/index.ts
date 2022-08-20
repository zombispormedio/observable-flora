import "./tracer";
import express from "express";
import path from "path";
import { router } from "./api";
import { database } from "./db";

const app = express();

app.use(express.json());

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist/client"));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
  });
}

async function main() {
  await database.connect();
  app.listen(process.env.PORT || 3000);
  console.log("Server is running on port 3000");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
