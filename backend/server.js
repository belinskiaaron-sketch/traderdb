import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());

app.post("/api/signup", async (req, res) => {
  const { email, form, source } = req.body;

  try {
    // 1. Send welcome email to user
    await resend.emails.send({
      from: "TradeDebrief <onboarding@resend.dev>",
      to: email,
      subject: "You're on the TradeDebrief waitlist ⚡",
      html: `
        <h2>You're in.</h2>
        <p>We’ll analyze your trading behavior every Sunday.</p>
        <p>You're joining from: ${source}</p>
      `,
    });

    // 2. Notify YOU
    await resend.emails.send({
      from: "TradeDebrief <onboarding@resend.dev>",
      to: "aaronbelinski@gmail.com",
      subject: "New signup",
      html: `<p>${email} just joined from ${form}</p>`,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Email failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
