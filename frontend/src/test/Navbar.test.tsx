import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../utils/auth", () => ({
  getToken: vi.fn(),
  parseJwt: vi.fn(),
  removeToken: vi.fn(),
}));

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockedNavigate,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});
import * as auth from "../utils/auth";
describe("Navbar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows Login when no token", () => {
    (auth.getToken as any).mockReturnValue(null);

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });

  it("shows user and logout when token present and logs out", () => {
    (auth.getToken as any).mockReturnValue("token");
    (auth.parseJwt as any).mockReturnValue({
      email: "a@b.com",
      role: "member",
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByText(/a@b.com/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Logout/i));

    expect(auth.removeToken).toHaveBeenCalled();
    expect(mockedNavigate).toHaveBeenCalledWith("/");
  });
});
