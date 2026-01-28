import { GoogleAuth } from "google-auth-library";

const SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];

/**
 * Get an OAuth access token suitable for calling Vertex AI / Llama.
 *
 * Order of precedence:
 * 1. If GCP_SERVICE_ACCOUNT_KEY is set (JSON), use it to mint a fresh token.
 * 2. Otherwise, fall back to GCP_ACCESS_TOKEN (manual short-lived token).
 */
export async function getAccessToken() {
  const saKey = process.env.GCP_SERVICE_ACCOUNT_KEY;

  if (saKey) {
    const credentials = JSON.parse(saKey);
    const auth = new GoogleAuth({ credentials, scopes: SCOPES });
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    if (!token) {
      throw new Error("Failed to obtain access token from service account.");
    }
    return token;
  }

  const manualToken = process.env.GCP_ACCESS_TOKEN;
  if (!manualToken) {
    throw new Error(
      "Missing GCP_SERVICE_ACCOUNT_KEY and GCP_ACCESS_TOKEN. Configure one of them.",
    );
  }
  return manualToken;
}

