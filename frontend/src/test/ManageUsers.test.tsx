import { render, screen, waitFor } from "@testing-library/react";
import ManageUsers from "../components/manageUsers";
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
describe("ManageUsers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("navigates to login when no token", () => {
    (auth.getToken as any).mockReturnValue(null);

    render(<ManageUsers />);

    expect(mockedNavigate).toHaveBeenCalledWith("/login");
  });

  it("fetches and displays users when admin", async () => {
    (auth.getToken as any).mockReturnValue("token");
    (auth.parseJwt as any).mockReturnValue({ role: "admin" });

    (globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { userid: 1, customerCode: "c1", email: "u@x.com", role: "member" },
        ],
      }),
    });

    render(<ManageUsers />);

    await waitFor(() =>
      expect(screen.getByText(/u@x.com/i)).toBeInTheDocument(),
    );
  });
});
