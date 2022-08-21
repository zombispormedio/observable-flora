import { context, Span, trace } from "@opentelemetry/api";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";

const TracedNavigationContext = createContext<{
  currentSpan: Span | undefined;
  setNavigationSpan: () => void;
  resetNavigationSpan: () => void;
}>({
  currentSpan: undefined,
  setNavigationSpan: () => {},
  resetNavigationSpan: () => {},
});

export const useTracedNavigation = () => useContext(TracedNavigationContext);

export const TracedNavigation = ({ children }: { children: ReactNode }) => {
  const [navigationSpan, setNavigationSpan] = useState<Span | undefined>();

  const value = useMemo(
    () => ({
      currentSpan: navigationSpan,
      setNavigationSpan: () => {
        setNavigationSpan(trace.getSpan(context.active()));
      },
      resetNavigationSpan: () => {
        setNavigationSpan(undefined);
      },
    }),
    [navigationSpan]
  );

  return (
    <TracedNavigationContext.Provider value={value}>
      {children}
    </TracedNavigationContext.Provider>
  );
};
