import { render, screen } from "@testing-library/react";
import Home from "../components/Home";
import { describe, it, expect, beforeEach, vi } from "vitest";
describe("Home", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      text: async () => "OK",
    });
  });

  it("renders highlights and backend message", async () => {
    render(<Home />);

    const statusPanel = screen
      .getByText("Library service")
      .closest(".status-panel");

    expect(statusPanel).toHaveTextContent(/checking backend connection/i);
  });
});
