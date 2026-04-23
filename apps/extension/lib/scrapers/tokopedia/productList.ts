import type { TokopediaProduct } from "../../types";
import { detectTokopediaPageType } from "./detect";

export function scrapeTokopediaProductList(): TokopediaProduct[] {
  const pageType = detectTokopediaPageType();
  console.log("[Tokopedia Scraper] Page type:", pageType, "| URL:", window.location.href);

  // Primary: try window.__NEXT_DATA__ or window.INITIAL_STATE
  // TODO: inspect actual Tokopedia data structure
  const items = document.querySelectorAll('[data-testid="divProductWrapper"]');
  console.log("[Tokopedia Scraper] Found", items.length, 'items via [data-testid="divProductWrapper"]');

  // Stub — parsing implemented in next phase after DOM inspection
  return [];
}
