// src/components/FloatingButton.tsx

import React, { useState } from "react";
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
      <button
        onClick={togglePopup}
        className="absolute bottom-4 text-3xl right-4 bg-primary text-white shadow-xl h-14 w-14 rounded-full"
      >
        <i className="fa-solid fa-plus"></i>
      </button>

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
