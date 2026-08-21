// Error tracking setup with Sentry (Opcional)
// Descomente e adicione seu DSN para ativar o monitoramento em produção

// import * as Sentry from "@sentry/react";

// Sentry.init({
//   dsn: "YOUR_SENTRY_DSN",
//   environment: import.meta.env.MODE || "production",
//   integrations: [
//     new Sentry.BrowserTracing(),
//     new Sentry.Replay(),
//   ],
//   tracesSampleRate: 1.0,
//   replaysSessionSampleRate: 0.1,
//   replaysOnErrorSampleRate: 1.0,
// });

export const logError = (error: Error, context?: Record<string, any>) => {
  console.error("[Error Tracked]:", error, context);
  // Sentry.captureException(error, { extra: context });
};
