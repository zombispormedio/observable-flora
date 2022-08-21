import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { UserInteractionInstrumentation } from "@opentelemetry/instrumentation-user-interaction";
import { Resource } from "@opentelemetry/resources";
import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OPENTELEMETRY_AGENT_ENDPOINT } from "./config";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const provider = new WebTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "flora-client",
  }),
});

// provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

provider.addSpanProcessor(
  new SimpleSpanProcessor(
    new OTLPTraceExporter({
      url: OPENTELEMETRY_AGENT_ENDPOINT,
    })
  )
);

provider.register();

registerInstrumentations({
  instrumentations: [
    new UserInteractionInstrumentation({
      shouldPreventSpanCreation: (eventType, element, span) => {
        span.setAttribute("target_element_class_name", element.className);
        span.setAttribute("target_element_id", element.id);
        const testId = element.getAttribute("data-testid");
        if (testId) {
          span.setAttribute("target_element_testid", testId);
        }

        return false;
      },
    }),
    new FetchInstrumentation({
      clearTimingResources: true,
      propagateTraceHeaderCorsUrls: [
        /.+/g, //Regex to match your backend urls. This should be updated.
      ],
    }),
  ],
});
