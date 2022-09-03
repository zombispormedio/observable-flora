import { useEffect, useRef } from "react";
import { useTracedPage } from "./TracedPage";

export function usePrevious<T>(value: T): T {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref: any = useRef<T>();
  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes
  // Return previous value (happens before update in useEffect above)
  return ref.current;
}

export const useTracePageDataLoad = (
  loading: boolean,
  refetching?: boolean
) => {
  const previousLoading = usePrevious(loading);
  const previousRefetching = usePrevious(refetching);
  const tracedPage = useTracedPage();

  useEffect(() => {
    if (previousLoading && !loading) {
      tracedPage.endPageSpan();
    }
  }, [previousLoading, loading]);

  useEffect(() => {
    if (previousRefetching && !refetching) {
      tracedPage.endPageSpan({
        "data.refetch": true,
      });
    }
  }, [previousRefetching, refetching]);
};
