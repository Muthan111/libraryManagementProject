import { render, screen } from "@testing-library/react";
import BorrowedBooks from "../pages/borrowedBooks";
import { describe, it, expect } from "vitest";

describe("BorrowedBooks", () => {
  it("renders placeholder", () => {
    render(<BorrowedBooks />);
    expect(screen.getByText("B")).toBeTruthy();
  });
});
