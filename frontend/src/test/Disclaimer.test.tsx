import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Disclaimer } from "../components/Disclaimer";

describe("Disclaimer", () => {
  it("keeps the clinical review warning visible", () => {
    render(<Disclaimer />);
    expect(screen.getByText(/Clinical review required/)).toBeInTheDocument();
  });
});
