import { Router } from "express";
import { verifyFirebaseIdTokenStrict, mintCustomToken } from "./firebaseAdmin";
import { authRateLimiter } from "./rateLimiters";

/**
 * BOLT Desktop sign-in bridge.
 *
 * The Electron app never performs Google/email sign-in inside its own
 * embedded window (Google blocks OAuth in embedded webviews, and it's
 * bad practice regardless). Instead:
 *
 *   1. Electron opens the user's system default browser to
 *      /desktop-auth.html?state=<csrf>
 *   2. That static page runs the normal Firebase Web SDK sign-in flow
 *      in a real browser (allowed by Google).
 *   3. It POSTs the resulting Firebase ID token here.
 *   4. This route cryptographically verifies that ID token with the
 *      Admin SDK and mints a short-lived custom token.
 *   5. The page redirects to bolt://auth-callback?state=...&token=...
 *      which the desktop app's protocol handler picks up and uses with
 *      signInWithCustomToken() to complete sign-in in the Electron window.
 *
 * No Admin credentials or long-lived secrets ever reach the client.
 */
const router = Router();

router.post("/api/desktop-auth/exchange", authRateLimiter, async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!idToken) {
      res.status(401).json({ success: false, message: "Missing ID token." });
      return;
    }

    const verified = await verifyFirebaseIdTokenStrict(idToken);
    if (!verified) {
      res.status(401).json({ success: false, message: "Invalid or expired sign-in. Please try again." });
      return;
    }

    const customToken = await mintCustomToken(verified.uid);
    if (!customToken) {
      res.status(503).json({ success: false, message: "Sign-in bridge temporarily unavailable." });
      return;
    }

    res.json({ success: true, token: customToken });
  } catch (err: any) {
    console.error("desktop-auth exchange failed:", err.message);
    res.status(500).json({ success: false, message: "Sign-in bridge failed." });
  }
});

export default router;
