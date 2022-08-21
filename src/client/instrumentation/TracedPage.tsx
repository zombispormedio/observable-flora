import { Context, context, ContextAPI, Span, trace } from "@opentelemetry/api";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useTracedNavigation } from "./TracedNavigation";
import { getTracer } from "./tracer";

const TracedPageContext = createContext<{
  getPageSpan: () => Span | undefined;
  endPageSpan: () => void;
}>({
  getPageSpan: () => undefined,
  endPageSpan: () => {},
});

export const useTracedPage = () => useContext(TracedPageContext);

export const TracedPage = ({
  page,
  children,
}: {
  page: string;
  children: ReactNode;
}) => {
  const tracedNavigation = useTracedNavigation();
  const pageSpanRef = useRef<Span | undefined>();
  const createPageSpan = (parentContext?: Context) =>
    getTracer().startSpan(
      `pageDataLoad:${page}`,
      {
        attributes: {
          component: "page",
          page,
          "location.url": window.location.href,
        },
      },
      parentContext
    );
  if (!pageSpanRef.current) {
    pageSpanRef.current = createPageSpan(
      tracedNavigation.currentSpan
        ? trace.setSpan(context.active(), tracedNavigation.currentSpan)
        : undefined
    );
  }

  const value = useMemo(
    () => ({
      getPageSpan: () => pageSpanRef.current,
      endPageSpan: () => {
        if (pageSpanRef.current) {
          pageSpanRef.current.end();
          tracedNavigation.resetNavigationSpan();
          pageSpanRef.current = createPageSpan();
        }
      },
    }),
    []
  );

  return (
    <TracedPageContext.Provider value={value}>
      {children}
    </TracedPageContext.Provider>
  );
};
