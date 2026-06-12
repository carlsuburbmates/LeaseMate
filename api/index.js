// Vercel serverless function entry point.
// This file loads the pre-built Express bundle from dist/api.js.
// The build:vercel script compiles api/index.ts -> dist/api.js (CJS, all deps bundled).
const path = require("path");
const bundlePath = path.resolve(__dirname, "../dist/api.js");
const app = require(bundlePath).default || require(bundlePath);
module.exports = app;
