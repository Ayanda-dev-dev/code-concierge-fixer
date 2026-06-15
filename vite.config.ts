import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // The lovable wrapper passes this through to the bundled @tanstack/react-start plugin.
  // Type is too narrow in the wrapper's d.ts but the runtime supports it.
  // @ts-expect-error -- tanstackStart key is supported at runtime
  tanstackStart: {
    server: { entry: "server" },
  },
});
