import {
  context,
  Span,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import {
  parseQueryArgs,
  parseMutationArgs,
  useQuery,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  MutationKey,
  MutationFunction,
  UseQueryOptions,
  QueryKey,
  QueryFunction,
  UseMutateFunction,
  UseMutateAsyncFunction,
  MutateOptions,
} from "@tanstack/react-query";
import React, { useCallback, useRef } from "react";
import { useTracedPage } from "./TracedPage";
import { getTracer } from "./tracer";

export const useTracedQuery = function <
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  arg1: TQueryKey | UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg2?:
    | QueryFunction<TQueryFnData, TQueryKey>
    | UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg3?: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
) {
  const tracedPage = useTracedPage();
  const { queryFn, queryKey, ...restOfArgs } = parseQueryArgs(arg1, arg2, arg3);

  return useQuery({
    ...restOfArgs,
    queryKey,
    queryFn: queryFn
      ? (...queryFnArgs) => {
          const parentSpan = tracedPage.getPageSpan();
          const span = getTracer().startSpan(
            `query${queryFn.name ? `:${queryFn.name}` : ""}`,
            {
              kind: SpanKind.CLIENT,
              attributes: {
                component: "query",
                "query.key": JSON.stringify(queryKey),
                "location.url": window.location.href,
              },
            },
            parentSpan ? trace.setSpan(context.active(), parentSpan) : undefined
          );
          let returnResult: ReturnType<typeof queryFn>;
          try {
            returnResult = context.with(
              trace.setSpan(context.active(), span),
              () => queryFn(...queryFnArgs)
            );
          } catch (error) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: (error as unknown as Error | undefined)?.message,
            });
            span.recordException(error as unknown as Error);
            throw error;
          }
          if (returnResult instanceof Promise) {
            returnResult = returnResult
              .then((data) => {
                span.setStatus({
                  code: SpanStatusCode.OK,
                });
                return data;
              })
              .catch((error) => {
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: (error as unknown as Error | undefined)?.message,
                });
                span.recordException(error as unknown as Error);
                throw error;
              })
              .finally(() => {
                span.end();
              });
          } else {
            span.setStatus({
              code: SpanStatusCode.OK,
            });
            span.end();
          }
          return returnResult;
        }
      : undefined,
  });
} as typeof useQuery;

export const useTracedMutation = function <
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  arg1:
    | MutationKey
    | MutationFunction<TData, TVariables>
    | UseMutationOptions<TData, TError, TVariables, TContext>,
  arg2?:
    | MutationFunction<TData, TVariables>
    | UseMutationOptions<TData, TError, TVariables, TContext>,
  arg3?: UseMutationOptions<TData, TError, TVariables, TContext>
) {
  const { mutationFn, onMutate, onSettled, onSuccess, onError, ...restOfArgs } =
    parseMutationArgs(arg1, arg2, arg3) as UseMutationOptions<
      TData,
      TError,
      TVariables,
      TContext
    >;

  type TVariablesWithOpentelemetry = {
    variables: TVariables;
    opentelemetry?: { currentSpan: Span };
  };

  const { mutate, mutateAsync, ...rest } = useMutation<
    TData,
    TError,
    TVariablesWithOpentelemetry,
    TContext
  >({
    ...restOfArgs,

    onMutate: ({ variables }) => {
      return onMutate?.(variables);
    },
    onSuccess(data, { variables }, context) {
      return onSuccess?.(data, variables, context);
    },

    onSettled: (data, error, { variables }, context) => {
      return onSettled?.(data, error, variables, context);
    },
    onError: (error, { variables }, context) => {
      return onError?.(error, variables, context);
    },
    mutationFn: mutationFn
      ? ({ opentelemetry, variables }) => {
          if (!opentelemetry) return mutationFn?.(variables);
          return context.with(
            trace.setSpan(context.active(), opentelemetry.currentSpan),
            () => mutationFn?.(variables)
          );
        }
      : undefined,
  });

  return {
    ...rest,
    mutate: useCallback<UseMutateFunction<TData, TError, TVariables, TContext>>(
      (variables, options) => {
        const span = getTracer().startSpan(
          `mutate${mutationFn?.name ? `:${mutationFn.name}` : ""}`,
          {
            kind: SpanKind.CLIENT,
            attributes: {
              component: "mutation",
            },
          }
        );

        return mutate(
          {
            variables,
            opentelemetry: {
              currentSpan: span,
            },
          },
          {
            ...options,
            onSuccess: (data, { variables }, context) => {
              span.setStatus({
                code: SpanStatusCode.OK,
              });
              return options?.onSuccess?.(data, variables, context);
            },
            onSettled: (data, error, { variables }, context) => {
              span.end();
              return options?.onSettled?.(data, error, variables, context);
            },
            onError: (error, { variables }, context) => {
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: (error as unknown as Error | undefined)?.message,
              });
              span.recordException(error as unknown as Error);
              return options?.onError?.(error, variables, context);
            },
          }
        );
      },
      [mutate]
    ),

    mutateAsync: useCallback<
      UseMutateAsyncFunction<TData, TError, TVariables, TContext>
    >(
      (variables, options) => {
        const span = getTracer().startSpan(
          `mutateAsync${mutationFn?.name ? `:${mutationFn.name}` : ""}`,
          {
            kind: SpanKind.CLIENT,
            attributes: {
              component: "mutation",
            },
          }
        );
        return mutateAsync(
          {
            variables,
            opentelemetry: {
              currentSpan: span,
            },
          },
          {
            ...options,
            onSuccess: (data, { variables }, context) => {
              span.setStatus({
                code: SpanStatusCode.OK,
              });
              return options?.onSuccess?.(data, variables, context);
            },
            onSettled: (data, error, { variables }, context) => {
              span.end();
              return options?.onSettled?.(data, error, variables, context);
            },
            onError: (error, { variables }, context) => {
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: (error as unknown as Error | undefined)?.message,
              });
              span.recordException(error as unknown as Error);
              return options?.onError?.(error, variables, context);
            },
          }
        );
      },
      [mutateAsync]
    ),
  } as UseMutationResult<TData, TError, TVariables, TContext>;
} as typeof useMutation;
