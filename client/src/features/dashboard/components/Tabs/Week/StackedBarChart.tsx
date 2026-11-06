/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  Tooltip,
} from "recharts";
import { convertDashedToCapitalized } from "@/utils";
import { useAppContext } from "@/lib/app-context";

const StackedBarChart: React.FC<{
  data: { date: string; amount: number; weekDay: string }[];
}> = ({ data = [] }) => {
  const { dispatch } = useAppContext();

  const handleBarClick = (data: any) => {
    dispatch({ type: "SET_CURR_DATE", payload: data.date });
    dispatch({ type: "CHANGE_VIEW", payload: "day" });
    // You can add more logic here, like navigating or displaying more info.
  };
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart margin={{ top: 16 }} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="weekDay"
          tick={{
            strokeWidth: 1,
            fontWeight: 400,
          }}
        />
        <YAxis hide />
        <Bar dataKey="amount" stackId="a" fill="#fff" onClick={handleBarClick}>
          <LabelList dataKey="amount" position="top" fill="#666" />
        </Bar>
        <Tooltip
          contentStyle={{ color: "#666666" }}
          itemStyle={{ color: "#666666" }}
          formatter={(value: string, name: string) => [
            `₹ ${value}`,
            convertDashedToCapitalized(name),
          ]}
          labelFormatter={(_label: any, payload: any) => {
            const [{ payload: load = { date: "" } } = {}] = payload;
            return load.date;
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default StackedBarChart;
