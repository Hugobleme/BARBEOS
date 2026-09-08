process.env.PORT = process.env.PORT || "4173";
process.env.NITRO_PORT = process.env.NITRO_PORT || "4173";

await import("../.output/server/index.mjs");
