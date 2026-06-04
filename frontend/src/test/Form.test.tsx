import { render, screen, fireEvent } from "@testing-library/react";
import Form from "../components/form";
import { describe, it, expect, beforeEach, vi } from "vitest";
describe("Form", () => {
  beforeEach(() => vi.resetAllMocks());

  it("shows name validation message", () => {
    render(<Form />);

    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    expect(screen.getByText(/full name/i)).toBeInTheDocument();
  });

  it("shows email validation message", () => {
    render(<Form />);

    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "Test User" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    expect(screen.getByText(/Email/i)).toBeInTheDocument();
  });

  it("shows password validation message", () => {
    render(<Form />);

    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "short" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    expect(
      screen.getByText(/Password must be at least 8 characters/i),
    ).toBeInTheDocument();
  });
});
