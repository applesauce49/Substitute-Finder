import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { refreshAuthMiddleware, refreshToken } from "../auth/tokenRefresh.js";
import User from "../models/User.js";

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

test("refresh flow accepts recently expired tokens and issues a new JWT", async () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalFindById = User.findById;

  process.env.JWT_SECRET = "refresh-test-secret";

  User.findById = () => ({
    lean: async () => ({
      _id: "user-1",
      username: "alex",
      email: "alex@example.com",
      admin: false,
    }),
  });

  const token = jwt.sign(
    {
      data: {
        _id: "user-1",
        username: "alex",
        email: "alex@example.com",
        admin: false,
      },
    },
    process.env.JWT_SECRET,
    { expiresIn: -60 }
  );

  const req = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };
  const middlewareRes = createResponse();
  let nextCalled = false;

  try {
    await refreshAuthMiddleware(req, middlewareRes, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(middlewareRes.statusCode, 200);
    assert.equal(req.user._id, "user-1");

    const refreshRes = createResponse();
    await refreshToken(req, refreshRes);

    assert.equal(refreshRes.statusCode, 200);
    assert.equal(refreshRes.payload.user.email, "alex@example.com");
    assert.equal(typeof refreshRes.payload.token, "string");
  } finally {
    User.findById = originalFindById;
    process.env.JWT_SECRET = originalSecret;
  }
});

test("refresh middleware rejects tokens older than the allowed refresh window", async () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalMaxAge = process.env.JWT_REFRESH_MAX_AGE_SECONDS;

  process.env.JWT_SECRET = "refresh-test-secret";
  process.env.JWT_REFRESH_MAX_AGE_SECONDS = "30";

  const token = jwt.sign(
    {
      data: {
        _id: "user-1",
        username: "alex",
        email: "alex@example.com",
        admin: false,
      },
    },
    process.env.JWT_SECRET,
    { expiresIn: -120 }
  );

  const req = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };
  const res = createResponse();
  let nextCalled = false;

  try {
    await refreshAuthMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.payload.error, "Token too old to refresh");
  } finally {
    process.env.JWT_SECRET = originalSecret;
    process.env.JWT_REFRESH_MAX_AGE_SECONDS = originalMaxAge;
  }
});