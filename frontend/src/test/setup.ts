import "@testing-library/jest-dom";
import {  vi } from "vitest";
Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
  value: vi.fn(),
});
globalThis.fetch = vi.fn();