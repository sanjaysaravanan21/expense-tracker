import { api } from "@/lib/api-client";

export type ExpenseInput = {
  category: string;
  amount: number;
  type?: "expense" | "income" | string;
  date: string;
  time: string;
  paidTo?: string;
};

export const addExpense = async (expense: ExpenseInput) => {
  const response = await api.post("/items", expense);
  return response.data;
};

export const editExpense = (id: string, expense: Partial<ExpenseInput>) =>
  api.put(`/items/${id}`, expense);

export const getDayResponse = (date: string) => api.get(`/items/day/${date}`);

export const getWeekResponse = (startDate: string) =>
  api.get(`/items/week/${startDate}`);

export const getMonthResponse = (startDate: string) =>
  api.get(`/items/month/${startDate}`);
