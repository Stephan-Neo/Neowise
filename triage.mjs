import { classify } from "./mock-ai.mjs";

const VALID_TOPICS = new Set(["delivery", "pricing", "other"]);
const MODEL_TIMEOUT_MS = 300;

const MANUAL_REVIEW_BODY = {
  status: "manual_review",
  topic: null,
  draft: null,
};

export function validateInput(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return { ok: false, status: 400, body: { status: "invalid_input" } };
  }
  return { ok: true };
}

export async function runTriage(text) {
  const validation = validateInput(text);
  if (!validation.ok) {
    return { status: validation.status, body: validation.body };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
    let raw;
    try {
      raw = await classify(text, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { status: 200, body: { ...MANUAL_REVIEW_BODY } };
    }

    const { topic, draft } = parsed;
    if (
      !VALID_TOPICS.has(topic) ||
      typeof draft !== "string" ||
      draft.trim().length === 0
    ) {
      return { status: 200, body: { ...MANUAL_REVIEW_BODY } };
    }

    return { status: 200, body: { status: "ready", topic, draft } };
  } catch {
    return { status: 200, body: { ...MANUAL_REVIEW_BODY } };
  }
}