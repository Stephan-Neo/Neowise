import test from "node:test";
import assert from "node:assert/strict";
import { runTriage, validateInput } from "./triage.mjs";

test("пустой ввод — invalid_input", () => {
  const result = validateInput("   ");
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { status: "invalid_input" });
});

test("таймаут модели — manual_review", async () => {
  const { status, body } = await runTriage("заявка [timeout]");
  assert.equal(status, 200);
  assert.deepEqual(body, {
    status: "manual_review",
    topic: null,
    draft: null,
  });
});

test("ошибка модели — manual_review", async () => {
  const { status, body } = await runTriage("заявка [error]");
  assert.equal(status, 200);
  assert.deepEqual(body, {
    status: "manual_review",
    topic: null,
    draft: null,
  });
});

test("недопустимая тема — manual_review", async () => {
  const { status, body } = await runTriage("заявка [bad-topic]");
  assert.equal(status, 200);
  assert.deepEqual(body, {
    status: "manual_review",
    topic: null,
    draft: null,
  });
});

test("успешный разбор доставки", async () => {
  const { status, body } = await runTriage("Когда будет доставка?");
  assert.equal(status, 200);
  assert.equal(body.status, "ready");
  assert.equal(body.topic, "delivery");
  assert.match(body.draft, /Спасибо/);
});