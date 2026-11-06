import React, { useEffect, useRef, useState } from "react";
import { getNextPrevMonth, getStartOfMonth } from "@/utils";
import { getMonthResponse } from "../../../api";
import { useAppContext } from "@/lib/app-context";
import moment from "moment";

// Define the type for the Day object
type Day = {
  amount: number;
  date: string; // Assuming this will be a date string in 'YYYY-MM-DD' format
};

// Define the type for the props of the Calendar component
interface CalendarProps {
  days: Day[];
  startIndex?: number;
}

const Calendar: React.FC<CalendarProps> = ({ days, startIndex }) => {
  const { dispatch } = useAppContext();
  // Calculate the maximum amount to scale the circle sizes
  const maxAmount = Math.max(...days.map((day) => day.amount));

  // Helper function to get the size of the circle based on the amount
  const getCircleSize = (amount: number) => {
    const minSize = 20; // Min circle size (in pixels)
    const maxSize = 60; // Max circle size (in pixels)
    return (amount / maxAmount) * (maxSize - minSize) + minSize;
  };

  const navigateToDay = (date: string) => {
    dispatch({ type: "SET_CURR_DATE", payload: date });
    dispatch({ type: "CHANGE_VIEW", payload: "day" });
  };

  return (
    <>
      <div className="grid grid-cols-7 gap-x-6 gap-y-2 p-2 pt-1">
        {[...Array(startIndex), ...days].map((day, i) => {
          if (!day) {
            return <div key={i}></div>;
          }
          const circleSize = getCircleSize(day.amount);
          return (
            <div
              key={day.date}
              className="flex flex-col justify-center items-center"
            >
              {/* Tooltip wrapper */}
              <div className="relative group">
                {/* Circle for the day */}
                <button
                  className="rounded-full flex items-center justify-center transition-all duration-300 ease-in-out"
                  style={{
                    width: `${circleSize}px`,
                    height: `${circleSize}px`,
                    background: `rgba(255, 255, 255, ${circleSize / 60})`,
                  }}
                  onClick={() => navigateToDay(day.date)}
                >
                  <span className="text-xs font-bold" style={{ color: "#666" }}>
                    {new Date(day.date).getDate()}
                  </span>
                </button>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block p-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10">
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(day.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Amount:</strong> ₹{day.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Month: React.FC = () => {
  const [mounted, setMounted] = useState<boolean>(false);

  const contentRef = useRef<HTMLSpanElement>(null);
  const { dispatch } = useAppContext();
  const [currStartDate, setCurrStartDate] = useState<string>(getStartOfMonth());
  const [amount, setAmount] = useState<number>(0);
  const [days, setDays] = useState<{ amount: number; date: string }[]>([]);

  const handleMonthChange = (type: "next" | "prev") => {
    /* setCurrStartDate(getStartOfWeekSunday(currStartDate, type)); */
    setCurrStartDate(getNextPrevMonth(currStartDate, type));
  };

  const resizeFunc = () => {
    const offsetHeight = contentRef.current?.offsetHeight || 0;
    dispatch({
      type: "SET_ITEMS_TOP",
      payload: offsetHeight + 110,
    });
    localStorage.setItem(
      "month_offset_height",
      JSON.stringify(offsetHeight + 110)
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const { data } = await getMonthResponse(currStartDate);
        const { monthData = [], items = [], totalAmount = 0 } = data;
        setDays(monthData);
        setAmount(totalAmount);
        dispatch({ type: "LOAD_GROUP_DAYS", payload: monthData });
        dispatch({ type: "LOAD_ITEMS", payload: items });
        setMounted(true);
        setTimeout(resizeFunc, 100);
      } catch (e) {
        console.error(e);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currStartDate]);

  useEffect(() => {
    if (mounted) {
      resizeFunc();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currStartDate]);

  return (
    <span ref={contentRef}>
      <Calendar days={days} startIndex={new Date(currStartDate).getDay()} />
      <div className="grid grid-cols-7 gap-x-7 gap-y-1 p-2 pt-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((val) => (
          <span className="font-medium" style={{ color: "#666" }} key={val}>
            {val}
          </span>
        ))}
      </div>
      <div className="flex justify-between items-center my-3">
        <button onClick={() => handleMonthChange("prev")}>
          <i className="fa-solid fa-angle-left text-white fa-2x"></i>
        </button>
        <div className="text-center">
          <h3 className="text-white font-medium">
            {moment(currStartDate).format("MMMM YYYY")}
          </h3>
          <h3 className="font-bold">₹ {amount.toLocaleString("en-US")}</h3>
        </div>
        {currStartDate === getStartOfMonth() ? (
          <span></span>
        ) : (
          <button
            onClick={() => handleMonthChange("next")}
            disabled={currStartDate === getStartOfMonth()}
          >
            <i className="fa-solid fa-angle-right text-white fa-2x"></i>
          </button>
        )}
      </div>
    </span>
  );
};

export default Month;
