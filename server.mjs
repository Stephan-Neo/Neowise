import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { runTriage } from "./triage.mjs";

const html = await readFile(new URL("./index.html", import.meta.url));

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) {
    return { error: "invalid_input" };
  }
  try {
    return { data: JSON.parse(raw) };
  } catch {
    return { error: "invalid_input" };
  }
}

async function handleTriage(request, response) {
  const parsed = await readJsonBody(request);
  if (parsed.error) {
    return json(response, 400, { status: "invalid_input" });
  }
  const { text } = parsed.data ?? {};
  const { status, body } = await runTriage(text);
  return json(response, status, body);
}

createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
    return;
  }
  if (request.method !== "POST" || request.url !== "/api/triage") {
    return json(response, 404, { status: "not_found" });
  }
  try {
    await handleTriage(request, response);
  } catch {
    json(response, 500, { status: "server_error" });
  }
}).listen(Number(process.env.PORT || 3000), "127.0.0.1");