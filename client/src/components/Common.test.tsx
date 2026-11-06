import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Loading from "./Loading";
import CategoryItem from "./CategoryItem";

describe("common components", () => {
  it("renders the loading spinner", () => {
    render(<Loading />);

    expect(screen.getByTestId("spinner")).toBeVisible();
  });

  it("renders a capitalized category label", () => {
    render(
      <CategoryItem
        val="decor"
        handleType={() => undefined}
        icon="fa-solid"
        isSelected
      />
    );

    expect(screen.getByText("Decor")).toBeVisible();
  });
});
