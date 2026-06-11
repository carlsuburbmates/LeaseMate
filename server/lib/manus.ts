/**
 * Manus API client placeholder.
 * Wire up by:
 * 1. Setting MANUS_API_KEY via webdev_request_secrets
 * 2. Reading the manus-api skill for full SDK documentation
 * 3. Replacing stub functions with real Manus API calls.
 *
 * Primary use case: AI-assisted exception resolution in the Ops Center.
 * Post-launch enhancement — not required for MVP.
 */

const MANUS_API_URL = "https://api.manus.ai";
const MANUS_PROJECT_UID = "VX4QShQXeGdLy34svPWMma"; // LeaseMate project UID

/**
 * Create a Manus task to help the operator investigate a complex exception.
 * Returns a task URL the operator can open to get AI-assisted analysis.
 */
export async function createExceptionInvestigationTask(_params: {
  exceptionCode: string;
  exceptionId: number;
  description: string;
  requestId: number | null;
}): Promise<{ taskUrl: string }> {
  // TODO: Implement with Manus API post-launch
  // const response = await fetch(`${MANUS_API_URL}/v1/tasks`, {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${process.env.MANUS_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     projectUid: MANUS_PROJECT_UID,
  //     prompt: `Investigate LeaseMate exception ${params.exceptionCode} #${params.exceptionId}: ${params.description}`,
  //   }),
  // });
  // const data = await response.json();
  // return { taskUrl: data.taskUrl };
  throw new Error("Manus API integration not yet active. Set MANUS_API_KEY to enable.");
}

export { MANUS_API_URL, MANUS_PROJECT_UID };
