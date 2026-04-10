import test from "node:test";
import assert from "node:assert/strict";

import { schedulerAuth } from "../auth/schedulerAuth.js";

function createResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    },
  };
}

test("schedulerAuth returns 500 when SCHEDULER_API_KEY is not configured", () => {
  const originalKey = process.env.SCHEDULER_API_KEY;
  delete process.env.SCHEDULER_API_KEY;

  const req = { get: () => undefined };
  const res = createResponse();
  let nextCalled = false;

  try {
    schedulerAuth(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 500);
    assert.equal(res.payload.success, false);
  } finally {
    process.env.SCHEDULER_API_KEY = originalKey;
  }
});

test("schedulerAuth returns 401 for invalid scheduler key", () => {
  const originalKey = process.env.SCHEDULER_API_KEY;
  process.env.SCHEDULER_API_KEY = "expected-key";

  const req = { get: () => "wrong-key" };
  const res = createResponse();
  let nextCalled = false;

  try {
    schedulerAuth(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.payload.success, false);
  } finally {
    process.env.SCHEDULER_API_KEY = originalKey;
  }
});

test("schedulerAuth calls next for valid scheduler key", () => {
  const originalKey = process.env.SCHEDULER_API_KEY;
  process.env.SCHEDULER_API_KEY = "expected-key";

  const req = { get: () => "expected-key" };
  const res = createResponse();
  let nextCalled = false;

  try {
    schedulerAuth(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload, null);
  } finally {
    process.env.SCHEDULER_API_KEY = originalKey;
  }
});
