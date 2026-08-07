/**
 * Production deploy via Vercel CLI.
 * Uses system CA store on Windows (same as npm run dev) to avoid TLS errors.
 */
const { execSync } = require("child_process");

const args = process.argv.slice(2);
const prod = args.includes("--preview") ? "" : "--prod";
const yes = args.includes("--no-yes") ? "" : "--yes";

execSync(`vercel ${prod} ${yes}`.trim(), {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, "--use-system-ca"].filter(Boolean).join(" "),
  },
});
