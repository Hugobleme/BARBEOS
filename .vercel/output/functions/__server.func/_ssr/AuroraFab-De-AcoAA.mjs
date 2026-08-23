import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as cn } from "./router-CQpyXUQj.mjs";
import { ae as Mic } from "../_libs/lucide-react.mjs";
const AuroraDrawer = reactExports.lazy(() => import("./AuroraDrawer-DyTB8yfw.mjs").then((m) => ({ default: m.AuroraDrawer })));
function AuroraFab({ barbershopId, barbershopName, className }) {
  const [open, setOpen] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen(true),
        "aria-label": "Falar com a Aurora",
        className: cn(
          "fixed bottom-5 right-5 z-40 group flex items-center gap-2 rounded-full pl-4 pr-5 py-3",
          "bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-background font-medium",
          "shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all",
          "ring-1 ring-amber-300/40",
          className
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-9 w-9 items-center justify-center rounded-full bg-background/15", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "h-5 w-5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-0 rounded-full bg-background/20 animate-ping opacity-60 group-hover:opacity-100" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm hidden sm:inline", children: "Falar com Aurora" })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AuroraDrawer, { open, onOpenChange: setOpen, barbershopId, barbershopName }) })
  ] });
}
export {
  AuroraFab as A
};
