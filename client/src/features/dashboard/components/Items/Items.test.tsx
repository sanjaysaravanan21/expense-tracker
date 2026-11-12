import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { AppProvider } from "@/lib/app-context";
import ItemList from "./Items";

const renderWithItems = (
  items: object[],
  groupDays: { date: string; amount: number }[] | null = null,
) => {
  localStorage.setItem(
    "state",
    JSON.stringify({
      items,
      groupDays,
      expenseView: groupDays ? "week" : "day",
      itemsTop: 400,
      userDetails: null,
    })
  );
  return render(
    <AppProvider>
      <ItemList />
    </AppProvider>
  );
};

const selectCategory = (category: string) => {
  const label = screen.getByText(category, { selector: "span" });
  const container = label.parentElement;
  if (!container) throw new Error("Category container not found");
  fireEvent.click(within(container).getByRole("button"));
};

describe("ItemList", () => {
  it("renders the expense rows from the session state", () => {
    renderWithItems([
      { category: "food", amount: 120.7, paidTo: "Cafe", type: "expense", date: "2024-09-18" },
    ]);

    expect(screen.getByText("Cafe")).toBeVisible();
    expect(screen.getByText("₹ 120")).toBeVisible();
  });

  it("renders no rows when there are no items", () => {
    renderWithItems([]);

    expect(screen.queryByText(/₹/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/No Records Found/)).toHaveLength(1);
  });

  it("only renders dates with matching expenses and updates them when the category changes", () => {
    renderWithItems(
      [
        { category: "food", amount: 10, paidTo: "Cafe", type: "expense", date: "2024-09-18" },
        { category: "grocery", amount: 20, paidTo: "Market", type: "expense", date: "2024-09-19" },
        { category: "food", amount: 30, paidTo: "Bakery", type: "expense", date: "2024-09-19" },
      ],
      [
        { date: "2024-09-18", amount: 10 },
        { date: "2024-09-19", amount: 50 },
        { date: "2024-09-20", amount: 0 },
      ],
    );

    expect(screen.getByText("2024-09-18")).toBeVisible();
    expect(screen.getByText("2024-09-19")).toBeVisible();
    expect(screen.queryByText("2024-09-20")).not.toBeInTheDocument();
    expect(screen.queryByText(/No Records Found/)).not.toBeInTheDocument();

    selectCategory("Grocery");
    expect(screen.queryByText("2024-09-18")).not.toBeInTheDocument();
    expect(screen.getByText("2024-09-19")).toBeVisible();
    expect(screen.getByText("Market")).toBeVisible();
    expect(screen.queryByText("Cafe")).not.toBeInTheDocument();
    expect(screen.queryByText("Bakery")).not.toBeInTheDocument();
    expect(screen.queryByText(/No Records Found/)).not.toBeInTheDocument();

    selectCategory("Food");
    expect(screen.getByText("2024-09-18")).toBeVisible();
    expect(screen.getByText("2024-09-19")).toBeVisible();
    expect(screen.getByText("Cafe")).toBeVisible();
    expect(screen.getByText("Bakery")).toBeVisible();
    expect(screen.queryByText("Market")).not.toBeInTheDocument();

    selectCategory("Health");
    expect(screen.queryByText("2024-09-18")).not.toBeInTheDocument();
    expect(screen.queryByText("2024-09-19")).not.toBeInTheDocument();
    expect(screen.getAllByText(/No Records Found/)).toHaveLength(1);

    selectCategory("All");
    expect(screen.getByText("Cafe")).toBeVisible();
    expect(screen.getByText("Market")).toBeVisible();
    expect(screen.queryByText(/No Records Found/)).not.toBeInTheDocument();
  });

  it("shows one empty state when grouped dates have no matching expenses", () => {
    renderWithItems([], [
      { date: "2024-09-18", amount: 0 },
      { date: "2024-09-19", amount: 0 },
    ]);

    expect(screen.getAllByText(/No Records Found/)).toHaveLength(1);
    expect(screen.queryByText("2024-09-18")).not.toBeInTheDocument();
    expect(screen.queryByText("2024-09-19")).not.toBeInTheDocument();
  });

  it("shows one empty state for an empty grouped list", () => {
    renderWithItems([], []);

    expect(screen.getAllByText(/No Records Found/)).toHaveLength(1);
  });

  it("shows one empty state when an ungrouped category has no matches", () => {
    renderWithItems([
      { category: "food", amount: 10, paidTo: "Cafe", type: "expense", date: "2024-09-18" },
    ]);

    selectCategory("Health");
    expect(screen.queryByText("Cafe")).not.toBeInTheDocument();
    expect(screen.getAllByText(/No Records Found/)).toHaveLength(1);
  });

  it("preserves the scroll area's clearance below the expense list", () => {
    renderWithItems([
      { category: "food", amount: 10, paidTo: "Cafe", type: "expense", date: "2024-09-18" },
    ]);

    const scrollArea = screen.getByText("Cafe").closest(".overflow-y-auto");
    expect(scrollArea).toHaveStyle({ height: "calc(100% - 120px)" });
  });
});
