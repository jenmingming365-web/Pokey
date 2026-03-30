const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");
const input = require("input"); // Used for the initial login only
require("dotenv").config();

const app = express();
app.use(express.json());

// Your specific Telegram Credentials
const apiId = 20088147;
const apiHash = "5b48b6b450f3035d321761f8cbcf1870";

// Load the session from Render Environment Variables
const sessionString = new StringSession(process.env.TELEGRAM_SESSION || "");

const client = new TelegramClient(sessionString, apiId, apiHash, {
  connectionRetries: 5,
});

// --- STEP 1: INITIAL LOGIN (Run this on Replit/Phone first) ---
async function generateSession() {
  await client.start({
    phoneNumber: async () => await input.text("Enter Phone (+123...): "),
    password: async () => await input.text("Enter 2FA Password: "),
    phoneCode: async () => await input.text("Enter Code from Telegram: "),
    onError: (err) => console.log(err),
  });
  console.log("\n🚀 COPY THIS SESSION STRING FOR RENDER:");
  console.log(client.session.save());
  console.log("------------------------------------------\n");
}

// --- STEP 2: THE WEB SERVER (This runs on Render) ---
if (process.env.TELEGRAM_SESSION) {
  (async () => {
    await client.connect();
    console.log("✅ Connected to Telegram as Server");
  })();

  app.get("/", (req, res) => res.send("API is Live"));

  app.post("/send-auth-code", async (req, res) => {
    const { recipient, authCode, requestSecret } = req.body;

    // Security check using your password
    if (requestSecret !== "Jyzel168169") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await client.sendMessage(recipient, {
        message: `Your login code is: **${authCode}**`,
        parseMode: "markdown",
      });
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
} else {
  // If no session exists, run the login helper
  generateSession();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));
