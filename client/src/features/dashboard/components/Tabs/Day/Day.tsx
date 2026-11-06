import React, { useEffect, useState } from "react";
import CustomPieChart from "./CustomPieChart";

import { getDayResponse } from "../../../api";
import { getAdjacentDate, getCurrentDate } from "@/utils";
import { useAppContext } from "@/lib/app-context";

interface Expense {
  category: string;
  amount: number;
  type: "expense" | "income" | "savings";
  date: string;
  time: string;
  paidTo: string;
}

interface DayResponse {
  totalAmount: number;
  items: Expense[];
}

const Day: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const [dayData, setData] = useState<DayResponse>({
    totalAmount: 0,
    items: [],
  });

  const handleDateChange = (type: "next" | "prev") => {
    dispatch({
      type: "SET_CURR_DATE",
      payload: getAdjacentDate(state.currDate, type),
    });
  };

  useEffect(
    () => () => {
      dispatch({ type: "SET_CURR_DATE", payload: getCurrentDate() });
    },
    [dispatch]
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const { data } = await getDayResponse(state.currDate);
        setData(data);
        dispatch({ type: "LOAD_ITEMS", payload: data.items });
        dispatch({ type: "LOAD_GROUP_DAYS", payload: null });
      } catch (e) {
        console.error(e);
        alert("Unable to Load the Data, Please try later");
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currDate]);

  return (
    <div className="">
      <CustomPieChart data={dayData.items} totalAmount={dayData.totalAmount} />
      <div className="flex justify-between items-center">
        <button onClick={() => handleDateChange("prev")}>
          <i className="fa-solid fa-angle-left text-white fa-2x"></i>
        </button>
        <h3 className="text-white font-bold">{state.currDate}</h3>
        {state.currDate === getCurrentDate() ? (
          <span></span>
        ) : (
          <button
            onClick={() => handleDateChange("next")}
            disabled={state.currDate === getCurrentDate()}
          >
            <i className="fa-solid fa-angle-right text-white fa-2x"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default Day;
