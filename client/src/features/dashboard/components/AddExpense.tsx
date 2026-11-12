// src/components/FloatingButton.tsx

import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppContext } from "@/lib/app-context";
import { addExpense } from "../api";
import items from "../data/expense-types.json";
import CategoryItem from "@/components/CategoryItem";

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  centered: boolean;
  extraClasses?: string;
}
const CustomInput: React.FC<CustomInputProps> = ({
  centered = false,
  extraClasses = "",
  ...props
}) => {
  return (
    <input
      {...props}
      className={`border-b-2 border-grey-dark p-2 ${
        centered ? "text-center" : ""
      } w-full outline-none ${extraClasses}`}
      required
    />
  );
};

const initialFormState = {
  category: "",
  amount: "",
  date: "",
  time: "",
  paidTo: "",
};

const AddExpense: React.FC = () => {
  const { dispatch } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState(initialFormState);
  const [tooltip, setTooltip] = useState<"hidden" | "visible" | "fading">("hidden");
  const location = useLocation();
  const buttonContainer = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout>>();
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const longPress = useRef(false);
  const suppressClick = useRef(false);

  const clearTooltipTimers = () => {
    clearTimeout(showTimer.current);
    clearTimeout(hideTimer.current);
  };

  const dismissTooltip = () => {
    clearTooltipTimers();
    setTooltip("hidden");
  };

  useEffect(() => {
    const dismissOutside = (event: Event) => {
      if (event.target instanceof Node && !buttonContainer.current?.contains(event.target)) {
        clearTooltipTimers();
        setTooltip("hidden");
      }
    };
    document.addEventListener("touchstart", dismissOutside);
    document.addEventListener("mousedown", dismissOutside);
    return () => {
      document.removeEventListener("touchstart", dismissOutside);
      document.removeEventListener("mousedown", dismissOutside);
      clearTooltipTimers();
      longPress.current = false;
      suppressClick.current = false;
      setTooltip("hidden");
    };
  }, [location.key]);

  const handleMouseEnter = () => {
    clearTooltipTimers();
    showTimer.current = setTimeout(() => setTooltip("visible"), 300);
  };

  const handleMouseLeave = () => {
    clearTooltipTimers();
    setTooltip((current) => current === "visible" ? "fading" : "hidden");
    hideTimer.current = setTimeout(() => setTooltip("hidden"), 150);
  };

  const handleTouchStart = () => {
    clearTooltipTimers();
    suppressClick.current = false;
    longPress.current = false;
    showTimer.current = setTimeout(() => {
      longPress.current = true;
      setTooltip("visible");
    }, 400);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    clearTimeout(showTimer.current);
    if (longPress.current) {
      event.preventDefault();
      suppressClick.current = true;
    }
  };

  const togglePopup = () => {
    setIsOpen(!isOpen);
    setFormData(initialFormState);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleType = (val: string) => {
    setFormData({
      ...formData,
      category: val,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.category) {
      dispatch({ type: "SET_LOADING", payload: true });
      // Handle form submission logic (e.g., API call)
      addExpense({
        ...formData,
        amount: Number(formData.amount),
        type: "expense",
      });
      // await addExpense({ ...formData, amount: Number(formData.amount) });
      togglePopup();
      dispatch({ type: "SET_LOADING", payload: false });
    } else {
      setError("Please select a category");
    }
  };

  return (
    <>
      {/* Floating Add Button */}
      {!isOpen && <div ref={buttonContainer} className="absolute bottom-4 right-4">
        {tooltip !== "hidden" && (
          <div
            role="tooltip"
            className="absolute bottom-full right-0 mb-2 max-w-[calc(100vw-2rem)] overflow-hidden text-ellipsis rounded-lg bg-[#1E232A] px-3 py-2 text-sm text-white whitespace-nowrap pointer-events-none"
            style={{ opacity: tooltip === "visible" ? 1 : 0, transition: "opacity 150ms" }}
          >
            Add Expense
          </div>
        )}
        <button
          type="button"
          aria-label="Add Expense"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse") suppressClick.current = false;
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") suppressClick.current = false;
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={() => { clearTimeout(showTimer.current); }}
          onTouchCancel={() => { longPress.current = false; dismissTooltip(); }}
          onClick={() => {
            if (suppressClick.current) {
              suppressClick.current = false;
              return;
            }
            dismissTooltip();
            togglePopup();
          }}
          className="text-3xl bg-primary text-white shadow-xl h-14 w-14 rounded-full"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>}

      {/* Popup/Modal */}
      {isOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-black ">
          <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md rounded-3xl">
            <h2 className="text-xl text-center font-bold mb-4">Add Expense</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4 text-center font-bold text-xl">
                <span>₹</span>
                <CustomInput
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  type="text"
                  inputMode="numeric"
                  centered
                  extraClasses="max-w-24"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Select Category</label>
                <div className="flex gap-x-2 justify-between overflow-x-auto no-scrollbar py-2">
                  {items.slice(1).map((item, index) => (
                    <CategoryItem
                      {...item}
                      key={index}
                      handleType={handleType}
                      isSelected={formData.category === item.val}
                    />
                  ))}
                </div>
                <h3 className="text-xs text-red-500">{error}</h3>
              </div>
              <div className="mb-4 w-full">
                <label className="block text-gray-700">Paid To</label>
                <CustomInput
                  type="text"
                  onChange={handleChange}
                  value={formData.paidTo}
                  name="paidTo"
                  centered={false}
                  placeholder="Enter the name who received payment"
                />
              </div>
              <div className="mb-4 w-full">
                <label className="block text-gray-700">Select Date</label>
                <CustomInput
                  type="date"
                  onChange={handleChange}
                  value={formData.date}
                  name="date"
                  centered={false}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Time</label>
                <CustomInput
                  type="time"
                  name="time"
                  onChange={handleChange}
                  value={formData.time}
                  centered={false}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white rounded-lg p-2"
              >
                Add Expense
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={togglePopup}
                  className="mt-2 text-red-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddExpense;
