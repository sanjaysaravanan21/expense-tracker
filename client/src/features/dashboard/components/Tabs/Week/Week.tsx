import React, { useEffect, useState } from "react";
import StackedBarChart from "./StackedBarChart";
import { getCurrentDate } from "@/utils";
import { useAppContext } from "@/lib/app-context";
import { getWeekResponse } from "../../../api";
import moment from "moment";

function getCurrStartOfWeek() {
  const date = new Date(getCurrentDate());
  const day = date.getDay(); // Get the day of the week (0 - Sunday, 6 - Saturday)
  const diff = date.getDate() - day; // Calculate the difference to the start of the week
  const startOfWeek = new Date(date.setDate(diff)); // Set the date to the start of the week
  return startOfWeek.toISOString().split("T")[0]; // Format to 'YYYY-MM-DD'
}

function getStartOfWeekSunday(startDate: string, type: "next" | "prev") {
  const date = new Date(startDate); // Convert the input string to a Date object

  // Find the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const currentDay = date.getDay(); // Get the current week's start date (should be Sunday)

  // Determine the offset based on the type parameter
  const offset = type === "next" ? 7 : -7; // 7 days for next week, -7 days for previous week

  // Calculate the new start date for the specified week
  date.setDate(date.getDate() + offset);

  // Adjust to the start of the week (Sunday)
  date.setDate(date.getDate() - currentDay); // Set to the nearest previous Sunday

  return date.toISOString().split("T")[0]; // Format to 'YYYY-MM-DD'
}

const Week: React.FC = () => {
  const { dispatch } = useAppContext();
  const [data, setData] = useState<
    { date: string; amount: number; weekDay: string }[]
  >([]);
  const [currStartDate, setCurrStartDate] = useState<string>(
    getCurrStartOfWeek()
  );
  const [amount, setAmount] = useState<number>(0);

  const handleWeekChange = (type: "next" | "prev") => {
    setCurrStartDate(getStartOfWeekSunday(currStartDate, type));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const { data } = await getWeekResponse(currStartDate);
        const { weekData = [], items = [], totalAmount = 0 } = data;
        setData(weekData);
        setAmount(totalAmount);
        dispatch({ type: "LOAD_GROUP_DAYS", payload: weekData });
        dispatch({ type: "LOAD_ITEMS", payload: items });
      } catch {
        alert("Unable to Load the Data, Please try later");
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    loadData();
    return () => {
      dispatch({ type: "LOAD_GROUP_DAYS", payload: null });
    };
  }, [currStartDate, dispatch]);

  return (
    <div className="mt-1">
      <StackedBarChart data={data} />
      <div className="flex justify-between items-center">
        <button onClick={() => handleWeekChange("prev")}>
          <i className="fa-solid fa-angle-left text-white fa-2x"></i>
        </button>
        <div className="text-center">
          <h3 className="text-white font-medium">
            {moment(currStartDate).format("DD MMM")} -{" "}
            {moment(currStartDate).add(6, "days").format("DD MMM")}
          </h3>
          <h3 className="font-bold">₹ {amount.toLocaleString("en-US")}</h3>
        </div>
        <button
          onClick={() => handleWeekChange("next")}
          disabled={currStartDate === getCurrStartOfWeek()}
        >
          <i className="fa-solid fa-angle-right text-white fa-2x"></i>
        </button>
      </div>
    </div>
  );
};

export default Week;
