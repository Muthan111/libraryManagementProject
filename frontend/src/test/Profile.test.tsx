import { render, screen, waitFor } from "@testing-library/react";
import Profile from "../pages/profile";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../utils/auth", () => ({
  getToken: () => "token",
  parseJwt: () => ({
    name: "Test User",
    email: "test@example.com",
    role: "user",
  }),
}));

describe("Profile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders user profile from token", async () => {
    render(<Profile />);

    await waitFor(() => expect(screen.getByText(/Test User/i)).toBeTruthy());
    expect(screen.getByText(/test@example.com/i)).toBeTruthy();
  });
});
