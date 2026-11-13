import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppProvider } from "@/lib/app-context";
import ItemList from "./Items";

const renderWithItems = (
  items: object[],
  groupDays: { date: string; amount: number }[] | null = null
) => {
  localStorage.setItem(
    "state",
    JSON.stringify({
      items,
      groupDays,
      expenseView: "day",
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
  });

  it("renders only date groups containing visible expenses after filtering", () => {
    renderWithItems(
      [
        { category: "grocery", amount: 120, paidTo: "Market", type: "expense", date: "2024-09-18" },
        { category: "food", amount: 80, paidTo: "Cafe", type: "expense", date: "2024-09-20" },
      ],
      [
        { date: "2024-09-18", amount: 120 },
        { date: "2024-09-19", amount: 0 },
        { date: "2024-09-20", amount: 80 },
      ]
    );

    expect(screen.getByText("2024-09-18")).toBeVisible();
    expect(screen.queryByText("2024-09-19")).not.toBeInTheDocument();
    expect(screen.getByText("2024-09-20")).toBeVisible();

    const foodCategory = screen.getByText("Food", { selector: "span" }).previousElementSibling;
    if (!(foodCategory instanceof HTMLButtonElement)) {
      throw new Error("Food category button was not found");
    }
    fireEvent.click(foodCategory);

    expect(screen.queryByText("2024-09-18")).not.toBeInTheDocument();
    expect(screen.queryByText("2024-09-19")).not.toBeInTheDocument();
    expect(screen.getByText("2024-09-20")).toBeVisible();
    expect(screen.getByText("Cafe")).toBeVisible();
    expect(screen.queryByText("Market")).not.toBeInTheDocument();
  });

  it("shows one empty state without date groups when no expenses match", () => {
    renderWithItems(
      [
        { category: "food", amount: 80, paidTo: "Cafe", type: "expense", date: "2024-09-20" },
      ],
      [
        { date: "2024-09-18", amount: 0 },
        { date: "2024-09-20", amount: 80 },
        { date: "2024-09-21", amount: 0 },
      ]
    );

    const groceryCategory = screen.getByText("Grocery", { selector: "span" }).previousElementSibling;
    if (!(groceryCategory instanceof HTMLButtonElement)) {
      throw new Error("Grocery category button was not found");
    }
    fireEvent.click(groceryCategory);

    expect(screen.getAllByText("No Records Found")).toHaveLength(1);
    expect(screen.queryByText("2024-09-18")).not.toBeInTheDocument();
    expect(screen.queryByText("2024-09-20")).not.toBeInTheDocument();
    expect(screen.queryByText("2024-09-21")).not.toBeInTheDocument();
  });

  it("preserves scroll clearance above the Add Expense button", () => {
    const { container } = renderWithItems([]);

    const scrollableList = container.querySelector('[style="height: calc(100% - 120px);"]');
    expect(scrollableList).toBeInTheDocument();
    expect(scrollableList).toHaveClass("pb-16");
  });
});
