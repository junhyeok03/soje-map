// The school Nginx router forwards the bare public path (/junhyeok/pj)
// unchanged, while paths with a trailing segment have their prefix removed.
// Serve the same home page at that one bare-path alias so both URL forms work.
export { default } from "../../page";
