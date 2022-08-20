import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { MongoDBInstrumentation } from "@opentelemetry/instrumentation-mongodb";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { Resource } from "@opentelemetry/resources";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
  }),
});

provider.addSpanProcessor(new SimpleSpanProcessor(new OTLPTraceExporter()));

// Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
provider.register();

registerInstrumentations({
  // // when boostraping with lerna for testing purposes
  instrumentations: [
    new HttpInstrumentation(),
    new MongoDBInstrumentation(),
    new ExpressInstrumentation(),
  ],
});
