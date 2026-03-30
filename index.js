const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const apiId = 20088147;
const apiHash = "5b48b6b450f3035d321761f8cbcf1870";
const stringSession = new StringSession("");

// This object remembers the codes: { "userId": "123456" }
const pendingCodes = {}; 

const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });

(async () => {
  try {
    await client.start({ botAuthToken: process.env.BOT_TOKEN });
    console.log("✅ Bot Online");
  } catch (err) { console.error("❌ Login Failed:", err.message); }
})();

// --- ENDPOINT 1: SEND THE CODE ---
app.post("/send-auth-code", async (req, res) => {
  const { recipient, requestSecret } = req.body;
  if (requestSecret !== process.env.API_SECRET_KEY) return res.status(401).json({ error: "Unauthorized" });

  const authCode = Math.floor(100000 + Math.random() * 900000).toString();
  pendingCodes[recipient] = authCode; // Save code in memory

  try {
    await client.sendMessage(recipient, {
      message: `🔐 Your login code is: **${authCode}**`,
      parseMode: "markdown",
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ENDPOINT 2: VERIFY THE CODE ---
app.post("/verify-code", (req, res) => {
  const { recipient, userCode } = req.body;

  if (pendingCodes[recipient] && pendingCodes[recipient] === userCode) {
    delete pendingCodes[recipient]; // Delete code after successful use
    return res.status(200).json({ success: true, message: "Login Successful!" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid or expired code." });
  }
});

app.listen(process.env.PORT || 3000);
