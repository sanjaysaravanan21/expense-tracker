import { useState } from "react";
import Login from "@/features/auth/components/Login";
import Register from "@/features/auth/components/Register";
import { useAppContext } from "@/lib/app-context";
import { Navigate } from "react-router-dom";

const App = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  if (state.isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="p-6 bg-white rounded min-h-screen">
      <div className="flex justify-between mb-4">
        <button
          className={`w-full p-2 rounded-lg ${
            activeTab === "login"
              ? "bg-primary text-white"
              : "text-primary font-bold"
          }`}
          onClick={() => setActiveTab("login")}
        >
          Login
        </button>
        <button
          className={`w-full p-2 rounded-lg ${
            activeTab === "register"
              ? "bg-primary text-white"
              : "text-primary font-bold"
          }`}
          onClick={() => setActiveTab("register")}
        >
          Register
        </button>
      </div>

      {activeTab === "login" ? <Login /> : <Register />}
    </div>
  );
};

export default App;
