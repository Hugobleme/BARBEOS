import { r as reactExports } from "./react.mjs";
import { r as reactDomExports } from "./react-dom.mjs";
import { V as Virtualizer, e as elementScroll, o as observeElementOffset, a as observeElementRect } from "./tanstack__virtual-core.mjs";
const useIsomorphicLayoutEffect = typeof document !== "undefined" ? reactExports.useLayoutEffect : reactExports.useEffect;
function useVirtualizerBase({
  useFlushSync = true,
  directDomUpdates = false,
  directDomUpdatesMode = "transform",
  ...options
}) {
  const rerender = reactExports.useReducer((x) => x + 1, 0)[1];
  const directRef = reactExports.useRef({
    enabled: directDomUpdates,
    mode: directDomUpdatesMode,
    container: null,
    lastSize: null,
    // Keyed by the element itself so a remounted node (same key, new DOM
    // node — e.g. when `enabled` is toggled off then on) is treated as fresh
    // and gets its style written.
    lastPositions: /* @__PURE__ */ new WeakMap(),
    prevRange: null
  });
  directRef.current.enabled = directDomUpdates;
  directRef.current.mode = directDomUpdatesMode;
  const applyDirectStyles = (instance2) => {
    const state = directRef.current;
    if (!state.enabled) return;
    const totalSize = instance2.getTotalSize();
    if (state.container && totalSize !== state.lastSize) {
      state.lastSize = totalSize;
      const sizeAxis = instance2.options.horizontal ? "width" : "height";
      state.container.style[sizeAxis] = `${totalSize}px`;
    }
    const horizontal = !!instance2.options.horizontal;
    const useTransform = state.mode === "transform";
    const posAxis = horizontal ? "left" : "top";
    const scrollMargin = instance2.options.scrollMargin;
    const items = instance2.getVirtualItems();
    for (const item of items) {
      const next = item.start - scrollMargin;
      const el = instance2.elementsCache.get(item.key);
      if (!el) continue;
      if (state.lastPositions.get(el) === next) continue;
      state.lastPositions.set(el, next);
      if (useTransform) {
        el.style.transform = horizontal ? `translate3d(${next}px, 0, 0)` : `translate3d(0, ${next}px, 0)`;
      } else {
        el.style[posAxis] = `${next}px`;
      }
    }
  };
  const resolvedOptions = {
    ...options,
    onChange: (instance2, sync) => {
      var _a;
      const state = directRef.current;
      let shouldRerender = true;
      if (state.enabled) {
        applyDirectStyles(instance2);
        const range = instance2.range;
        const prev = state.prevRange;
        shouldRerender = !prev || prev.isScrolling !== instance2.isScrolling || prev.startIndex !== (range == null ? void 0 : range.startIndex) || prev.endIndex !== (range == null ? void 0 : range.endIndex);
        if (shouldRerender) {
          state.prevRange = range ? {
            startIndex: range.startIndex,
            endIndex: range.endIndex,
            isScrolling: instance2.isScrolling
          } : null;
        }
      }
      if (shouldRerender) {
        if (useFlushSync && sync) {
          reactDomExports.flushSync(rerender);
        } else {
          rerender();
        }
      }
      (_a = options.onChange) == null ? void 0 : _a.call(options, instance2, sync);
    }
  };
  const [instance] = reactExports.useState(() => {
    const v = new Virtualizer(resolvedOptions);
    return Object.assign(v, {
      containerRef: (node) => {
        const state = directRef.current;
        state.container = node;
        state.lastSize = null;
        if (node && state.enabled) {
          const total = v.getTotalSize();
          state.lastSize = total;
          const axis = v.options.horizontal ? "width" : "height";
          node.style[axis] = `${total}px`;
        }
      }
    });
  });
  instance.setOptions(resolvedOptions);
  useIsomorphicLayoutEffect(() => {
    return instance._didMount();
  }, []);
  useIsomorphicLayoutEffect(() => {
    return instance._willUpdate();
  });
  useIsomorphicLayoutEffect(() => {
    applyDirectStyles(instance);
  });
  return instance;
}
function useVirtualizer(options) {
  return useVirtualizerBase({
    observeElementRect,
    observeElementOffset,
    scrollToFn: elementScroll,
    ...options
  });
}
export {
  useVirtualizer as u
};
