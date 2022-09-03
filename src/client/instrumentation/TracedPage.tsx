import { Attributes, Context, context, Span, trace } from "@opentelemetry/api";
import { createContext, ReactNode, useContext, useMemo, useRef } from "react";
import { useTracedNavigation } from "./TracedNavigation";
import { getTracer } from "./tracer";

const TracedPageContext = createContext<{
  getPageSpan: () => Span | undefined;
  endPageSpan: (attributes?: Attributes) => void;
}>({
  getPageSpan: () => undefined,
  endPageSpan: () => {},
});

export const useTracedPage = () => useContext(TracedPageContext);

const createPageSpan = (
  name: string,
  attributes?: Attributes,
  parentSpan?: Span
) =>
  getTracer().startSpan(
    name,
    {
      attributes: {
        ...attributes,
        component: "page",
        "location.url": window.location.href,
      },
    },
    parentSpan ? trace.setSpan(context.active(), parentSpan) : undefined
  );

export const TracedPage = ({
  page,
  children,
}: {
  page: string;
  children: ReactNode;
}) => {
  const tracedNavigation = useTracedNavigation();
  const pageSpanRef = useRef<Span | undefined>();
  const firstLoad = useRef<boolean>(false);

  if (!pageSpanRef.current && !firstLoad.current) {
    pageSpanRef.current = createPageSpan(
      `pageDataLoad:${page}`,
      {
        page,
        "data.status": "first_loading",
      },
      tracedNavigation.currentSpan
    );
    firstLoad.current = true;
  }

  const value = useMemo(
    () => ({
      getPageSpan: () => {
        if (!pageSpanRef.current) {
          pageSpanRef.current = createPageSpan(
            `pageDataLoad:${page}`,
            {
              page,
              "data.status": "loading",
            },
            tracedNavigation.currentSpan
          );
        }

        return pageSpanRef.current;
      },
      endPageSpan: (attributes?: Attributes) => {
        if (pageSpanRef.current) {
          if (attributes) {
            pageSpanRef.current.setAttributes(attributes);
          }
          pageSpanRef.current.end();
          pageSpanRef.current = undefined;
          tracedNavigation.resetNavigationSpan();
        }
      },
    }),
    [tracedNavigation]
  );

  return (
    <TracedPageContext.Provider value={value}>
      {children}
    </TracedPageContext.Provider>
  );
};
