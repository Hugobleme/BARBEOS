import { lucideImportsRule } from "./rules/lucide-imports.js";

export default {
  rules: {
    "lucide-imports": lucideImportsRule,

    "react-hooks/exhaustive-deps": { create() { return {}; } },
    "redos-detector/no-unsafe-regex": { create() { return {}; } },

  }
};
