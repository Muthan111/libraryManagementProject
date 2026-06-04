import { render, screen } from "@testing-library/react";
import Admin from "../pages/admin";
import { describe, it, expect, vi } from "vitest";

vi.mock("../components/manageBooks", () => ({
  default: () => <div>ManageBooksMock</div>,
}));
vi.mock("../components/manageUsers", () => ({
  default: () => <div>ManageUsersMock</div>,
}));

describe("Admin", () => {
  it("renders manage sections", () => {
    render(<Admin />);
    expect(screen.getByText("ManageBooksMock")).toBeTruthy();
    expect(screen.getByText("ManageUsersMock")).toBeTruthy();
  });
});
