import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { appStore } from "./app/store";
import { Toaster } from "./components/ui/sonner";
import { useLoadUserQuery } from "./features/api/authApi";
import LoadingSpinner from "./components/LoadingSpinner";
import React from "react";
import { ChatProvider } from "./context/ChatContext";

const Custom = ({ children }) => {
  const { isLoading } = useLoadUserQuery({
    refetchOnMountOrArgChange: true,
    skip: false,
  });

  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      {isLoading ? <LoadingSpinner /> : children}
    </React.Suspense>
  );
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={appStore}>
      <Custom>
        <ChatProvider>
          <App />
          <Toaster />
        </ChatProvider>
      </Custom>
    </Provider>
  </StrictMode>
);
