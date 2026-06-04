import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddBook from "../pages/AddBook";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../utils/auth", () => ({
  getToken: () => "token",
}));

describe("AddBook", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (globalThis as any).fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => "OK" });
  });

  it("renders form and submits", async () => {
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "New Name" },
    });
    fireEvent.change(screen.getByLabelText(/Author/i), {
      target: { value: "Author C" },
    });

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => expect((globalThis as any).fetch).toHaveBeenCalled());
  });
});
