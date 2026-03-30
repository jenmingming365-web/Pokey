const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

// Your Telegram Credentials
const apiId = 20088147;
const apiHash = "5b48b6b450f3035d321761f8cbcf1870";
const stringSession = new StringSession(""); // Bots stay empty

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

// Start the Bot automatically
(async () => {
  try {
    await client.start({
      botAuthToken: process.env.BOT_TOKEN, 
    });
    console.log("✅ API is online. Bot is logged in!");
  } catch (err) {
    console.error("❌ Login Failed:", err.message);
  }
})();

// Health Check for Render
app.get("/", (req, res) => res.send("Telegram Auth API is Active."));

// The API Endpoint your website will call
app.post("/send-auth-code", async (req, res) => {
  const { recipient, authCode, requestSecret } = req.body;

  // Security check: Must match Jyzel168169
  if (requestSecret !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 'recipient' can be the User ID (e.g. 1234567) or Username
    await client.sendMessage(recipient, {
      message: `🔐 Your login code is: **${authCode}**\n\n_Valid for 5 minutes._`,
      parseMode: "markdown",
    });
    res.status(200).json({ success: true, message: "Code sent!" });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Make sure the user has started the bot." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
