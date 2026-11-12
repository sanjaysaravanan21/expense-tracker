import React, { useEffect, useState } from "react";
import { convertDashedToCapitalized } from "@/utils";
import { useAppContext } from "@/lib/app-context";
import CategoryItem from "@/components/CategoryItem";
import items from "../../data/expense-types.json";

const ListItem: React.FC<{
  paidTo: string;
  amount: number;
  type: string;
  category: string;
}> = (props) => {
  const iconClass = items.find(({ val }) => props.category === val);

  return (
    <div className="flex gap-x-2 items-center mx-4 my-2">
      <button
        className={`shrink-0 text-black p-2 px-3 bg-primary-light text-primary rounded-lg min-w-12`}
      >
        <i className={`${iconClass?.icon} text-xl`}></i>
      </button>
      <div className="p-1 grow max-w-44 text-left">
        <h3 className="text-black font-medium">{props.paidTo}</h3>
        <p className="text-sm text-grey-dark">
          {convertDashedToCapitalized(props.category)}
        </p>
      </div>
      <h2 className="font-bold grow text-xl text-black text-right">
        ₹ {Math.floor(props.amount)}
      </h2>
    </div>
  );
};

const ItemList: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const [selection, setSelection] = useState({
    view: state.expenseView,
    type: "all",
  });
  // The category filter resets whenever the expense view changes.
  const type = selection.view === state.expenseView ? selection.type : "all";

  const handleOverlayValue = () => {
    if (state.expenseView === "week") {
      dispatch({ type: "SET_ITEMS_TOP", payload: 410 });
    } else if (state.expenseView === "day") {
      dispatch({ type: "SET_ITEMS_TOP", payload: 400 });
    } else {
      dispatch({
        type: "SET_ITEMS_TOP",
        payload: Number(localStorage.getItem("month_offset_height") || 400),
      });
    }
  };

  const handleSwipeUp = () => {
    if (state.itemsTop === 0) {
      handleOverlayValue();
    } else {
      dispatch({ type: "SET_ITEMS_TOP", payload: 0 });
    }
  };

  const handleType = (val: string) => {
    setSelection({ view: state.expenseView, type: val });
  };

  const filteredItems = state.items.filter(
    ({ category }) => type === "all" || category === type
  );
  const groups = state.groupDays?.map(({ date }) => ({
    date,
    items: filteredItems.filter((item) => item.date === date),
  })).filter((group) => group.items.length > 0);

  useEffect(() => {
    handleOverlayValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.expenseView]);

  return (
    <div
      className="absolute left-0 rounded-2xl bg-white text-center h-screen w-full"
      style={{
        top: state.itemsTop,
        height: `calc(100vh - ${state.itemsTop}px)`,
        transition: "all 250ms ease-in-out",
      }}
    >
      <button onClick={handleSwipeUp}>
        <i
          className={`fa-solid fa-angle-${
            state.itemsTop === 0 ? "down" : "up"
          } text-grey-dark fa-2x`}
        ></i>
      </button>
      <div className="flex gap-x-2 justify-between overflow-x-auto no-scrollbar px-4 py-2">
        {items.map((item, index) => (
          <CategoryItem
            {...item}
            key={index}
            handleType={handleType}
            isSelected={type === item.val}
          />
        ))}
      </div>
      <div
        className="h-full overflow-y-auto no-scrollbar"
        style={{ height: "calc(100% - 120px)" }}
      >
        {(groups ? groups.length === 0 : filteredItems.length === 0) ? (
          <span>"No Records Found"</span>
        ) : groups ? (
          groups.map(({ date, items: dayItems }) => (
            <div key={date}>
              <h3 className="text-xs font-medium mx-4 text-left text-grey-dark">
                {date}
              </h3>
              {dayItems.map((expense, i) => (
                <ListItem key={i} {...expense} />
              ))}
            </div>
          ))
        ) : (
          filteredItems.map((expense, i) => (
            <ListItem key={i} {...expense} />
          ))
        )}
      </div>
    </div>
  );
};

export default ItemList;
