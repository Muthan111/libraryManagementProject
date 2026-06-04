import { render, screen, waitFor } from "@testing-library/react";
import Book from "../pages/book";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

describe("Book", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            bookid: 1,
            bookCode: "BC1",
            name: "Test Book",
            Author: "Author A",
            ISBN: "123",
            status: "available",
            borrowedById: null,
          },
        ],
      }),
    });
  });

  it("renders list of books", async () => {
    render(
      <MemoryRouter>
        <Book />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/browse books/i)).toBeTruthy());
    expect(screen.getByText("Test Book")).toBeTruthy();
  });
});
