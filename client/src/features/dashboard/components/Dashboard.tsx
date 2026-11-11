import Tabs from "./Tabs/Tabs";
import ItemList from "./Items/Items";
import AddExpense from "./AddExpense";

const Dashboard: React.FC = () => {
  return (
    <div className="bg-primary text-white rounded-2xl">
      <div className="p-6 pb-0 pt-0 rounded-2xl">
        <h1 className="my-2 break-words text-2xl font-bold leading-tight text-black sm:text-3xl">
          Welcome to Expense Tracker
        </h1>
        <Tabs />
      </div>
      <ItemList />
      <AddExpense />
    </div>
  );
};

export default Dashboard;
