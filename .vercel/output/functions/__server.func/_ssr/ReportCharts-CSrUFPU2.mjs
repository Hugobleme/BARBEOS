import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { b as brl } from "./router-CQpyXUQj.mjs";
import "../_libs/sonner.mjs";
import { R as ResponsiveContainer, L as LineChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, b as Line, B as BarChart, c as Bar } from "../_libs/recharts.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "./client-BmPKwOzk.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/lucide-react.mjs";
import "../_libs/zod.mjs";
import "../_libs/lodash.mjs";
import "../_libs/react-smooth.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/fast-equals.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/react-is.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/recharts-scale.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
function RevenueChart({ data }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-[260px] w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "day", stroke: "hsl(var(--muted-foreground))", fontSize: 12 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { stroke: "hsl(var(--muted-foreground))", fontSize: 12, tickFormatter: (v) => `R$${v}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Tooltip,
      {
        formatter: (v) => brl(Number(v)),
        contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: "revenue", stroke: "hsl(var(--accent))", strokeWidth: 2, dot: false })
  ] }) }) });
}
function ServicesChart({ data }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-[260px] w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data, layout: "vertical", margin: { left: 8 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { type: "number", stroke: "hsl(var(--muted-foreground))", fontSize: 12, tickFormatter: (v) => `R$${v}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { dataKey: "name", type: "category", stroke: "hsl(var(--muted-foreground))", fontSize: 12, width: 120 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Tooltip,
      {
        formatter: (v) => brl(Number(v)),
        contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "revenue", fill: "hsl(var(--accent))", radius: [0, 6, 6, 0] })
  ] }) }) });
}
export {
  RevenueChart,
  ServicesChart
};
