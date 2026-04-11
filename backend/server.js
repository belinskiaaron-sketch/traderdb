import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());

const BUILD_ID = "v1.03-diagnostic";

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    build: BUILD_ID,
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    resendKeyPrefix: process.env.RESEND_API_KEY
      ? process.env.RESEND_API_KEY.slice(0, 6) + "..."
      : null,
    node: process.version,
  });
});

app.post("/api/signup", async (req, res) => {
  const { email, form, source } = req.body;
  console.log("[signup] incoming:", { email, form, source });

  try {
    const welcome = await resend.emails.send({
      from: "TradeDebrief <onboarding@tradedb.space>",
      to: email,
      subject: "You're on the TradeDebrief waitlist ⚡",
      html: `
        <h2>You're in.</h2>
        <p>We'll analyze your trading behavior every Sunday.</p>
        <p>You're joining from: ${source}</p>
      `,
    });
    console.log("[signup] welcome result:", JSON.stringify(welcome));
    if (welcome?.error) throw new Error(welcome.error.message || "welcome send failed");

    const notify = await resend.emails.send({
      from: "TradeDebrief <onboarding@tradedb.space>",
      to: "aaronbelinski@gmail.com",
      subject: "New signup",
      html: `<p>${email} just joined from ${form} (source: ${source})</p>`,
    });
    console.log("[signup] notify result:", JSON.stringify(notify));
    if (notify?.error) throw new Error(notify.error.message || "notify send failed");

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[signup] error:", err);
    res.status(500).json({ error: "Email failed", detail: String(err?.message || err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
