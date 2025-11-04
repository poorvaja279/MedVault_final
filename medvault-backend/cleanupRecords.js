// cleanupRecords.js
require("dotenv").config();
const mongoose = require("mongoose");
const { s3Client } = require("./config/s3");
const { ListObjectsV2Command } = require("@aws-sdk/client-s3");
const Record = require("./models/Record");

const BUCKET = process.env.AWS_BUCKET_NAME;

async function cleanupRecords() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected ✅");

    console.log(`Fetching current objects from S3 bucket: ${BUCKET}`);
    const s3Response = await s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET }));

    if (!s3Response.Contents || s3Response.Contents.length === 0) {
      console.warn("⚠️ No files found in S3 bucket (may be empty).");
    }

    const existingKeys = new Set(
      (s3Response.Contents || []).map(o => o.Key)
    );

    console.log(`Found ${existingKeys.size} objects in S3.`);
    console.log("Checking records in MongoDB...");

    const allRecords = await Record.find();
    let deletedCount = 0;

    for (const rec of allRecords) {
      if (!existingKeys.has(rec.fileKey)) {
        await Record.deleteOne({ _id: rec._id });
        console.log(`🗑 Deleted stale DB entry: ${rec.fileName}`);
        deletedCount++;
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} stale records.`);
    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error during cleanup:", err);
  }
}

cleanupRecords();
