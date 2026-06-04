import { render, screen, waitFor } from "@testing-library/react";
import BookDetail from "../pages/bookDetail";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

describe("BookDetail", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        bookid: 1,
        bookCode: "BC1",
        name: "Detailed Book",
        Author: "Author B",
        ISBN: "456",
        status: "available",
        borrowedById: null,
      }),
    });
  });

  it("renders book details", async () => {
    render(
      <MemoryRouter initialEntries={["/books/BC1"]}>
        <Routes>
          <Route path="/books/:bookCode" element={<BookDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Detailed Book/i)).toBeTruthy(),
    );
    expect(screen.getByText("BC1")).toBeTruthy();
  });
});
