// eslint-disable-next-line n/no-unpublished-import
import honoConfig from "@repo/eslint-config/hono.js";

export default Array.isArray(honoConfig)
  ? [...honoConfig, { ignores: ["dist/**"] }]
  : [{ ignores: ["dist/**"] }, honoConfig];
