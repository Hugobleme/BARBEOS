import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes default stale time
        gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
        retry: 1,
        refetchOnWindowFocus: false, // Avoid refetching when user switches tabs
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent", // Preload when user hovers or touches a link
    defaultPreloadStaleTime: 1000 * 60 * 2, // 2 minutes stale time for preloaded data
  });

  return router;
};
