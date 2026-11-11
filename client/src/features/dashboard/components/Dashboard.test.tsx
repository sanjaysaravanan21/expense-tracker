import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/lib/app-context";
import Dashboard from "./Dashboard";

vi.mock("./Tabs/Tabs", () => ({
  default: () => <section data-testid="expense-summary" />,
}));

vi.mock("./Items/Items", () => ({
  default: () => <section data-testid="expense-history" />,
}));

vi.mock("./AddExpense", () => ({
  default: () => <button type="button">Add expense</button>,
}));

describe("Dashboard", () => {
  beforeEach(() => {
    localStorage.setItem(
      "state",
      JSON.stringify({
        isAuthenticated: true,
        userDetails: {
          fullName: "Ada Lovelace",
          phoneNumber: "",
          email: "",
          createdAt: "",
          updatedAt: "",
          token: "",
        },
        items: [],
        groupDays: null,
        expenseView: "day",
        itemsTop: 400,
      })
    );
  });

  it("shows the welcome heading before expense controls", () => {
    const { container } = render(
      <AppProvider>
        <Dashboard />
      </AppProvider>
    );

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Welcome to Expense Tracker",
    });
    const summary = container.querySelector('[data-testid="expense-summary"]');
    const addExpense = screen.getByRole("button", { name: "Add expense" });

    if (!summary) {
      throw new Error("The expense summary should render");
    }

    expect(
      heading.compareDocumentPosition(summary) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      heading.compareDocumentPosition(addExpense) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("does not show a personalized salutation", () => {
    render(
      <AppProvider>
        <Dashboard />
      </AppProvider>
    );

    expect(screen.queryByText(/hello,/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
  });

  it("keeps the heading wrap-capable and ahead of controls", () => {
    const { container } = render(
      <AppProvider>
        <Dashboard />
      </AppProvider>
    );

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Welcome to Expense Tracker",
    });
    const summary = container.querySelector('[data-testid="expense-summary"]');
    const addExpense = screen.getByRole("button", { name: "Add expense" });

    if (!summary) {
      throw new Error("The expense summary should render");
    }

    expect(heading).toHaveClass("break-words", "sm:text-3xl", "text-black");
    expect(heading).not.toHaveClass("whitespace-nowrap", "truncate");
    expect(
      heading.compareDocumentPosition(summary) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      heading.compareDocumentPosition(addExpense) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
