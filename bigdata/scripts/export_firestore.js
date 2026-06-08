import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import serviceAccount from "../firebase-key.json" with {
  type: "json",
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function exportCollection(collectionName, outputFile) {
  const snapshot = await db.collection(collectionName).get();

  const data = [];

  snapshot.forEach((doc) => {
    data.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  const outputPath = path.join(
    __dirname,
    "..",
    "data",
    "raw",
    outputFile
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(data, null, 2)
  );

  console.log(
    `✓ ${collectionName} exported (${data.length} records)`
  );
}

async function main() {
  await exportCollection("alerts", "alerts.json");

  await exportCollection(
    "dailySummaries",
    "dailySummaries.json"
  );

  await exportCollection("sensors", "sensors.json");

  await exportCollection(
    "subscriptionPackages",
    "subscriptionPackages.json"
  );

  await exportCollection(
    "userSubscriptions",
    "userSubscriptions.json"
  );

  await exportCollection("users", "users.json");

  console.log("\nExport selesai!");
}

main();