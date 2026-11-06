import { Outlet } from "react-router-dom";
import { useAppContext } from "@/lib/app-context";
import Loading from "@/components/Loading";

const Layout: React.FC = () => {
  const { state } = useAppContext();
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="relative rounded-2xl shadow-lg max-w-sm w-full min-h-screen bg-primary">
        <Outlet />
        {state.isLoading && <Loading />}
      </div>
    </div>
  );
};

export default Layout;
