import { useContext } from "react";
import { LocationContext } from "./locationContextValue";

export const useToolLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useToolLocation must be used inside LocationProvider");
  }
  return context;
};
