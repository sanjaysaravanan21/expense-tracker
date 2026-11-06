// src/context/AppContext.tsx

import React, { createContext, useContext, useReducer } from "react";
import { getCurrentDate } from "@/utils";

// Define the Item interface
interface Item {
  datetime: string; // or Date if you want to handle Date objects
  category: string;
  amount: number;
  paidTo: string;
  type: "expense" | "income";
  date: string; // 'YYYY-MM-DD' format
  time: string; // '24 hr format'
  createdAt: string; // or Date if you want to handle Date objects
  updatedAt: string; // or Date if you want to handle Date objects
}

// Define the UserDetails interface
interface UserDetails {
  fullName: string;
  phoneNumber: string;
  email: string;
  createdAt: string; // or Date
  updatedAt: string; // or Date
  token: string;
}

interface GroupDay {
  date: string;
  amount: number;
}

// Define the AppState interface
interface AppState {
  items: Item[];
  isLoading: boolean;
  isAuthenticated: boolean;
  userDetails: UserDetails | null;
  expenseView: "day" | "week" | "month";
  groupDays: GroupDay[] | null;
  currDate: string;
  itemsTop: number;
  appSetup: boolean;
}

// Define the initial state
const initialState: AppState = {
  items: [],
  isLoading: false,
  isAuthenticated: false,
  userDetails: null,
  expenseView: "day",
  groupDays: null,
  currDate: getCurrentDate(),
  itemsTop: 400,
  appSetup: false,
};

// Define actions
type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_AUTHENTICATED"; payload: boolean }
  | { type: "SET_USER_DETAILS"; payload: UserDetails }
  | { type: "ADD_ITEM"; payload: Item }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "SET_CURR_DATE"; payload: string }
  | { type: "CHANGE_VIEW"; payload: "day" | "week" | "month" }
  | { type: "LOAD_ITEMS"; payload: Item[] }
  | { type: "LOAD_GROUP_DAYS"; payload: GroupDay[] | null }
  | { type: "LOGOUT_USER" }
  | { type: "SET_ITEMS_TOP"; payload: number }
  | { type: "SET_APP_SETUP"; payload: boolean };

// Create the context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Create a reducer function
const appReducer = (state: AppState, action: Action): AppState => {
  let localState: AppState;
  switch (action.type) {
    case "SET_LOADING":
      localState = { ...state, isLoading: action.payload };
      break;
    case "SET_AUTHENTICATED":
      localState = { ...state, isAuthenticated: action.payload };
      break;
    case "SET_USER_DETAILS":
      localState = { ...state, userDetails: action.payload };
      break;
    case "ADD_ITEM":
      localState = { ...state, items: [...state.items, action.payload] };
      break;
    case "REMOVE_ITEM":
      localState = {
        ...state,
        items: state.items.filter((item) => item.datetime !== action.payload),
      };
      break;
    case "CHANGE_VIEW":
      localState = {
        ...state,
        expenseView: action.payload,
      };
      break;
    case "LOAD_ITEMS":
      localState = {
        ...state,
        items: action.payload,
      };
      break;
    case "LOAD_GROUP_DAYS":
      localState = {
        ...state,
        groupDays: action.payload,
      };
      break;
    case "SET_CURR_DATE":
      localState = {
        ...state,
        currDate: action.payload,
      };
      break;
    case "LOGOUT_USER":
      localState = initialState;
      break;
    case "SET_ITEMS_TOP":
      localState = {
        ...state,
        itemsTop: action.payload,
      };
      break;
    case "SET_APP_SETUP":
      localState = {
        ...state,
        appSetup: action.payload,
      };
      break;
    default:
      localState = state;
  }
  localStorage.setItem("state", JSON.stringify(localState));
  return localState;
};

// Create a provider component
const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storageState = localStorage.getItem("state");

  const [state, dispatch] = useReducer(
    appReducer,
    storageState ? JSON.parse(storageState) : initialState
  );

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Create a custom hook to use the context
const useAppContext = () => {
  return useContext(AppContext);
};

export { AppProvider, useAppContext, AppContext };
