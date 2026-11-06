// src/App.tsx

import React, { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Loading from "@/components/Loading";
import Layout from "@/app/layout";
import { useAppContext } from "@/lib/app-context";
import SlowLoader from "@/components/SlowLoader";
import { appHealth, setUnauthorizedHandler } from "@/lib/api-client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
const Dashboard = lazy(() => import("@/features/dashboard/components/Dashboard"));
const Auth = lazy(() => import("@/app/routes/auth"));
const PageNotFound = lazy(() => import("@/app/routes/not-found"));

const ProtectedPage: React.FC<{ element: ReactNode }> = ({ element }) => {
  const { state } = useAppContext();

  const isAuthenticated = Boolean(state.userDetails);

  if (isAuthenticated) return element;

  return <Navigate to="/auth" />;
};

const App: React.FC = () => {
  const [mounted, setMounted] = useState<boolean>(false);
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    const testAppHealth = async () => {
      try {
        await appHealth();
      } catch (e) {
        console.log(e);
        dispatch({ type: "SET_APP_SETUP", payload: true });
      } finally {
        setMounted(true);
      }
    };
    testAppHealth();
  }, [dispatch]);

  // An expired or invalid token ends the session; ProtectedPage then redirects to /auth.
  useEffect(() => {
    setUnauthorizedHandler(() => dispatch({ type: "LOGOUT_USER" }));
    return () => setUnauthorizedHandler(undefined);
  }, [dispatch]);

  if (!mounted) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
      <Suspense fallback={<Loading />}>
        {!state.appSetup && mounted ? (
          <Routes>
            <Route element={<Layout />}>
              <Route
                path="/"
                element={<ProtectedPage element={<Dashboard />} />}
              />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<PageNotFound />} />
            </Route>
          </Routes>
        ) : (
          <SlowLoader />
        )}
      </Suspense>
    </Router>
    </ErrorBoundary>
  );
};

export default App;
