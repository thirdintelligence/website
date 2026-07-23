/**
 * bkWatch authenticated portal entrypoint.
 *
 * Rendering, auth, session rotation, manifest loading, and security headers
 * live in the shared platform. This wrapper contains no tenant HTML fork.
 */
import {
  createPortalPlatform,
  portalFunctionConfig
} from "../../lib/portal-platform.mjs";

const platform = createPortalPlatform("bkwatch");

export const portalShell = platform.portalShell;
export const loginPage = platform.loginPage;
export default platform.handler;
export const config = portalFunctionConfig;
