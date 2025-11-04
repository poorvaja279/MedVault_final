// backend/utils/signedUrl.js
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client } = require("../config/s3");

async function generateSignedUrl(key, expiresIn = 600) {
  const command = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key });
  return await getSignedUrl(s3Client, command, { expiresIn });
}

module.exports = { generateSignedUrl };
