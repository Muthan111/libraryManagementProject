import { render, screen, fireEvent } from "@testing-library/react";
import Login from "../components/Login";
import { describe, it, expect, beforeEach, vi } from "vitest";
vi.mock("../utils/auth", () => ({
  API_BASE: "",
  setToken: vi.fn(),
}));

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  ...(vi.importActual("react-router-dom") as any),
  useNavigate: () => mockedNavigate,
}));

describe("Login", () => {
  beforeEach(() => vi.resetAllMocks());

  it("shows validation message when fields are missing", () => {
    render(<Login />);

    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    expect(screen.getByText(/Email/i)).toBeInTheDocument();
    expect(screen.getByText(/Password/i)).toBeInTheDocument();
  });
});
