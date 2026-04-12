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

  const isFoundingMember = form === "founding-form";

  const userEmail = isFoundingMember
    ? {
        subject: "Welcome, founding member — here's what happens next",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
            <h2 style="font-size: 22px; margin-bottom: 4px;">You've claimed your founding member spot.</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              You're locking in <strong>$19/mo forever</strong> — before it goes to $29/mo for everyone else.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
            <p style="font-size: 15px; line-height: 1.6;">
              <strong>What happens next:</strong>
            </p>
            <ol style="font-size: 14px; line-height: 1.8; color: #333; padding-left: 20px;">
              <li>We'll send you a payment link within 24 hours to activate your founding membership.</li>
              <li>Once activated, you'll get immediate access to the full platform — trade logging, analytics dashboard, and AI weekly debriefs.</li>
              <li>You'll have a direct line to the founder. Reply to this email anytime — you'll shape what we build.</li>
            </ol>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
            <p style="font-size: 13px; color: #888; line-height: 1.5;">
              TradeDebrief — AI-powered trading journal<br>
              You signed up at ${source}
            </p>
          </div>
        `,
      }
    : {
        subject: "You're on the TradeDebrief waitlist",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
            <h2 style="font-size: 22px; margin-bottom: 4px;">You're on the list.</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              Thanks for your interest in TradeDebrief. We're building an AI-powered trading journal that analyzes your behavior and tells you exactly what to fix — every week.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
            <p style="font-size: 15px; line-height: 1.6;">
              <strong>What to expect:</strong>
            </p>
            <ul style="font-size: 14px; line-height: 1.8; color: #333; padding-left: 20px;">
              <li>Early access invite when we launch</li>
              <li>Priority onboarding and setup</li>
              <li>Founding member pricing ($19/mo locked forever) if you upgrade before we go live</li>
            </ul>
            <p style="font-size: 15px; line-height: 1.6; margin-top: 16px;">
              We'll be in touch soon. In the meantime, reply to this email if you have any questions.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
            <p style="font-size: 13px; color: #888; line-height: 1.5;">
              TradeDebrief — AI-powered trading journal<br>
              You signed up at ${source}
            </p>
          </div>
        `,
      };

  try {
    const welcome = await resend.emails.send({
      from: "TradeDebrief <onboarding@traderdb.space>",
      to: email,
      subject: userEmail.subject,
      html: userEmail.html,
    });
    console.log("[signup] welcome result:", JSON.stringify(welcome));
    if (welcome?.error) throw new Error(welcome.error.message || "welcome send failed");

    const notifySubject = isFoundingMember
      ? `New FOUNDING member: ${email}`
      : `New waitlist signup: ${email}`;

    const notify = await resend.emails.send({
      from: "TradeDebrief <onboarding@traderdb.space>",
      to: "aaronbelinski@gmail.com",
      subject: notifySubject,
      html: `
        <p><strong>${isFoundingMember ? "FOUNDING MEMBER" : "Waitlist"}</strong></p>
        <p>Email: ${email}</p>
        <p>Form: ${form}</p>
        <p>Source: ${source}</p>
        <p style="color: #888; font-size: 12px;">
          ${isFoundingMember ? "TODO: Send Stripe payment link to this user" : ""}
        </p>
      `,
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
