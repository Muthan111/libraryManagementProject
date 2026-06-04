import { render, screen, fireEvent } from "@testing-library/react";
import Chatbot from "../components/Chatbot";
import { describe, it, expect, beforeEach, vi } from "vitest";
describe("Chatbot", () => {
  beforeEach(() => vi.resetAllMocks());

  it("toggles open and close", () => {
    render(<Chatbot />);

    const toggle = screen.getByRole("button", {
      name: /Open chat|Close chat/i,
    });
    expect(toggle).toBeInTheDocument();

    // open
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    // now input should be present
    expect(screen.getByLabelText(/Type a message/i)).toBeInTheDocument();
  });

  it("enables send only when input has text", () => {
    render(<Chatbot />);

    const toggle = screen.getByRole("button", {
      name: /Open chat|Close chat/i,
    });
    fireEvent.click(toggle);

    const input = screen.getByLabelText(/Type a message/i);
    const send = screen.getByRole("button", { name: /Send/i });

    expect(send).toBeDisabled();

    fireEvent.change(input, { target: { value: "Hello" } });
    expect(send).not.toBeDisabled();
  });
});
