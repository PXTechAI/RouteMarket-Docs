import { loader } from "fumadocs-core/source";
import { docs } from "../../.source";
import { i18n } from "./i18n";

export const source = loader({
  baseUrl: "/",
  i18n,
  source: docs.toFumadocsSource(),
  slugs({ dirname, name }) {
    const dirSegments = dirname ? dirname.split("/") : [];

    if (name === "index") {
      return dirSegments;
    }

    return [...dirSegments, name];
  }
});
