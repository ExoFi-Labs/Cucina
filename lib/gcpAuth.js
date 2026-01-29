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
    let credentials;
    try {
      credentials = JSON.parse(saKey);
      // Fix private_key: if it has literal \n sequences (from env var escaping),
      // convert them to actual newlines that OpenSSL expects
      if (credentials.private_key && typeof credentials.private_key === "string") {
        credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
      }
    } catch (e) {
      throw new Error(
        `Failed to parse GCP_SERVICE_ACCOUNT_KEY as JSON: ${e.message}. Make sure it's a single-line JSON string with \\n for newlines in the private_key.`,
      );
    }
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

