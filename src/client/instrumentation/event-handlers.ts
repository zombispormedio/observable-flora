import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import { MouseEventHandler } from "react";
import { getTracer } from "./tracer";

export const useTracedEventHandler = function <TElement = HTMLButtonElement>(
  callback: MouseEventHandler<TElement>
): MouseEventHandler<TElement> {
  return function (event) {
    const span = getTracer().startSpan(
      `${event.type}Handler${callback.name ? `:${callback.name}` : ""}`,
      {
        attributes: {
          component: "eventHandler",
        },
      }
    );
    try {
      context.with(trace.setSpan(context.active(), span), () =>
        callback(event)
      );
      span.setStatus({
        code: SpanStatusCode.OK,
      });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error | undefined)?.message,
      });
      span.recordException(error as Error);
    } finally {
      span.end();
    }
  };
};
