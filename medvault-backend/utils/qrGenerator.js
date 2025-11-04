const QRCode = require("qrcode");

async function generateQrCode(data) {
  try {
    // Always stringify the object to JSON
    const strData = typeof data === "string" ? data : JSON.stringify(data);
    const qrDataUrl = await QRCode.toDataURL(strData);
    return qrDataUrl;
  } catch (err) {
    console.error("QR generation failed:", err);
    return await QRCode.toDataURL(JSON.stringify({ patientId: "UNKNOWN" }));
  }
}

module.exports = generateQrCode;