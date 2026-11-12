import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/lib/app-context";
import AddExpense from "./AddExpense";

const renderButton = () =>
  render(
    <MemoryRouter>
      <AppProvider>
        <AddExpense />
        <Link to="/other">Navigate</Link>
        <button>Outside</button>
      </AppProvider>
    </MemoryRouter>
  );

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("AddExpense tooltip", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("names the floating button and opens the existing form on click", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: "Add Expense" }));
    expect(screen.getByRole("heading", { name: "Add Expense" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Add Expense" })).toHaveLength(1);
  });

  it("shows after 300ms of hover and fades for 150ms on leave", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Add Expense" });
    fireEvent.mouseEnter(button);
    advance(299);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    advance(1);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Add Expense");
    fireEvent.mouseLeave(button);
    expect(tooltip).toHaveStyle({ opacity: "0" });
    advance(149);
    expect(tooltip).toBeInTheDocument();
    advance(1);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("cancels a hover that ends before the delay", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Add Expense" });
    fireEvent.mouseEnter(button);
    advance(299);
    fireEvent.mouseLeave(button);
    advance(300);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on a 400ms touch and suppresses the release click", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Add Expense" });
    fireEvent.touchStart(button);
    advance(399);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    advance(1);
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.touchEnd(button);
    fireEvent.click(button, { detail: 1 });
    expect(screen.queryByRole("heading", { name: "Add Expense" })).not.toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.click(button, { detail: 1 });
    expect(screen.getByRole("heading", { name: "Add Expense" })).toBeVisible();
  });

  it("suppresses the entire compatibility mouse sequence after a long touch", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Add Expense" });
    fireEvent.touchStart(button);
    advance(400);
    fireEvent.touchEnd(button);
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    fireEvent.click(button, { detail: 1 });
    expect(screen.queryByRole("heading", { name: "Add Expense" })).not.toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toBeVisible();
  });

  it("keeps suppression until a delayed compatibility click is consumed", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Add Expense" });
    fireEvent.touchStart(button);
    advance(400);
    fireEvent.touchEnd(button);
    advance(1000);
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    fireEvent.click(button, { detail: 1 });
    expect(screen.queryByRole("heading", { name: "Add Expense" })).not.toBeInTheDocument();
  });

  it("allows a subsequent genuine mouse action after a long touch", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Add Expense" });
    fireEvent.touchStart(button);
    advance(400);
    fireEvent.touchEnd(button);
    const pointerDown = new MouseEvent("pointerdown", { bubbles: true });
    Object.defineProperty(pointerDown, "pointerType", { value: "mouse" });
    fireEvent(button, pointerDown);
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    fireEvent.click(button, { detail: 1 });
    expect(screen.getByRole("heading", { name: "Add Expense" })).toBeVisible();
  });

  it("allows keyboard activation after a long touch", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Add Expense" });
    fireEvent.touchStart(button);
    advance(400);
    fireEvent.touchEnd(button);
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.click(button, { detail: 0 });
    expect(screen.getByRole("heading", { name: "Add Expense" })).toBeVisible();
  });

  it("allows a new short touch after a long touch without a compatibility click", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Add Expense" });
    fireEvent.touchStart(button);
    advance(400);
    fireEvent.touchEnd(button);
    fireEvent.touchStart(button);
    advance(100);
    fireEvent.touchEnd(button);
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    fireEvent.click(button, { detail: 1 });
    expect(screen.getByRole("heading", { name: "Add Expense" })).toBeVisible();
  });

  it("anchors the tooltip above the button and limits its width to the viewport", () => {
    renderButton();
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Add Expense" }));
    advance(300);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveClass("absolute", "bottom-full", "right-0", "max-w-[calc(100vw-2rem)]");
    expect(tooltip.parentElement).toHaveClass("absolute", "bottom-4", "right-4");
  });

  it("preserves the form action for a short touch", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Add Expense" });
    fireEvent.touchStart(button);
    advance(399);
    fireEvent.touchEnd(button);
    fireEvent.click(button);
    expect(screen.getByRole("heading", { name: "Add Expense" })).toBeVisible();
    advance(1);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("cancels a touch that moves or is interrupted", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Add Expense" });
    fireEvent.touchStart(button);
    advance(200);
    fireEvent.touchMove(button);
    advance(200);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.touchStart(button);
    advance(400);
    fireEvent.touchCancel(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("dismisses a long-press tooltip on an outside tap", () => {
    renderButton();
    fireEvent.touchStart(screen.getByRole("button", { name: "Add Expense" }));
    advance(400);
    fireEvent.touchEnd(screen.getByRole("button", { name: "Add Expense" }));
    fireEvent.touchStart(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("dismisses the tooltip and pending hover on navigation", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Add Expense" });
    fireEvent.mouseEnter(button);
    advance(300);
    fireEvent.click(screen.getByRole("link", { name: "Navigate" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.mouseEnter(button);
    advance(100);
    fireEvent.click(screen.getByRole("link", { name: "Navigate" }));
    advance(300);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
