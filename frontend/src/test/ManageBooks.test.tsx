import { render, screen, waitFor } from "@testing-library/react";
import ManageBooks from "../components/manageBooks";
import { describe, it, expect, beforeEach, vi } from "vitest";
const mockedNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  ...(vi.importActual("react-router-dom") as any),
  useNavigate: () => mockedNavigate,
}));

vi.mock("../utils/auth", () => ({
  getToken: vi.fn(),
  parseJwt: vi.fn(),
}));
import * as auth from "../utils/auth";
describe("ManageBooks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (global as any).fetch = vi.fn();
  });

  it("shows loading then book rows", async () => {
    // const auth = require("../utils/auth");
    (auth.getToken as any).mockReturnValue("token");
    (auth.parseJwt as any).mockReturnValue({ role: "admin" });

    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ bookid: 1, bookCode: "b1", name: "Book One", Author: "Auth" }],
      }),
    });

    render(<ManageBooks />);

    expect(screen.getByText(/Loading books/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(/Book One/i)).toBeInTheDocument(),
    );
  });
});
