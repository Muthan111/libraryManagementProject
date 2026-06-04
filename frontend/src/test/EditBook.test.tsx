import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditBook from "../pages/EditBook";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("../utils/auth", () => ({
  getToken: () => "token",
}));

describe("EditBook", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { name: "Existing", Author: "A", ISBN: "789", bookCode: "BCX" },
      }),
    });
  });

  it("loads book and submits update", async () => {
    render(
      <MemoryRouter initialEntries={["/books/edit/1"]}>
        <Routes>
          <Route path="/books/edit/:id" element={<EditBook />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByDisplayValue(/Existing/i)).toBeTruthy(),
    );

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "Updated" },
    });
    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => expect((globalThis as any).fetch).toHaveBeenCalled());
  });
});
