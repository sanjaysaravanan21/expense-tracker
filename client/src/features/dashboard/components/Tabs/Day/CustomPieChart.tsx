import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { convertDashedToCapitalized } from "@/utils";
import mockColors from "../../../data/colors.json";

interface Expense {
  category: string;
  amount: number;
}

interface PieChartProps {
  totalAmount?: number;
  data: Expense[];
}

const RADIAN = Math.PI / 180;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, value, name } = props;
  const radius = 105;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <>
      <text
        x={x}
        y={y}
        fill="white"
        fontSize={12}
        fontWeight={600}
        textAnchor={x > cx ? "start" : "end"}
      >
        {`${convertDashedToCapitalized(name)}`}
      </text>
      <text
        x={x}
        y={y + 15}
        fontSize={14}
        fontWeight={600}
        fill="#fff"
        textAnchor={x > cx ? "start" : "end"}
      >
        {`₹ ${value}`}
      </text>
    </>
  );
};

const CustomPieChart: React.FC<PieChartProps> = ({ data, totalAmount }) => {
  return (
    <div className="flex flex-col items-center">
      <div
        style={{ height: 250 }}
        className="flex flex-col place-content-center place-items-center absolute text-white font-medium text-xs"
      >
        <span>Total</span>
        <b className="text-lg">
          ₹ {totalAmount ? totalAmount.toLocaleString("en-US") : 0}
        </b>
      </div>
      <ResponsiveContainer height={250}>
        <PieChart width={250} height={250}>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            label={renderCustomizedLabel}
            labelLine={{ strokeWidth: 1, stroke: "white" }}
            animationDuration={250}
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={mockColors[index]}
                strokeWidth={2}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomPieChart;
