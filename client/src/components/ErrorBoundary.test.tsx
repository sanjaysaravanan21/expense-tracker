import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

const Boom = () => {
  throw new Error("boom");
};

describe("ErrorBoundary", () => {
  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>
    );

    expect(screen.getByText("fine")).toBeVisible();
  });

  it("shows a fallback with a reload button when a child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
  });
});
