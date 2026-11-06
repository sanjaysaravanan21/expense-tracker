import { useAppContext } from "@/lib/app-context";
import Tabs from "./Tabs/Tabs";
import ItemList from "./Items/Items";
import AddExpense from "./AddExpense";

const Dashboard: React.FC = () => {
  const { state } = useAppContext();

  return (
    <div className="bg-primary text-white rounded-2xl">
      <div className="p-6 pb-0 pt-0 rounded-2xl">
        <p className="font-medium text-xl my-2">
          Hello,{" "}
          <span className="font-bold">
            {state.userDetails?.fullName.split(" ")[0]}!
          </span>
        </p>
        <Tabs />
      </div>
      <ItemList />
      <AddExpense />
    </div>
  );
};

export default Dashboard;
