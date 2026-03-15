import { createContext, useContext, useState } from "react";

const DestinationContext = createContext(null);

export function DestinationProvider({ children }) {
  const [destination, setDestination] = useState("");
  const [askDestination, setAskDestination] = useState(false);

  return (
    <DestinationContext.Provider
      value={{
        destination,
        setDestination,
        askDestination,
        setAskDestination,
      }}
    >
      {children}
    </DestinationContext.Provider>
  );
}

export function useDestination() {
  return useContext(DestinationContext);
}
