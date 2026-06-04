import { render, screen } from "@testing-library/react";
import Button from "../components/button";

describe("Button", () => {
  it("renders text", () => {
    render(<Button label="Save" />);

    expect(screen.getByRole("button")).toHaveTextContent("Save");
  });
});
