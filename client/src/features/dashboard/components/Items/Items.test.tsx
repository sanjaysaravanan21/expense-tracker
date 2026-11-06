import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppProvider } from "@/lib/app-context";
import ItemList from "./Items";

const renderWithItems = (items: object[]) => {
  localStorage.setItem(
    "state",
    JSON.stringify({
      items,
      groupDays: null,
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
});
