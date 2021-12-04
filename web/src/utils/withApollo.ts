import { ApolloClient, InMemoryCache } from "@apollo/client";
import { createWithApollo } from "./createWithApollo";
import { NextPageContext } from "next";
import { PaginatedSentences, Score } from "../generated/graphql";

const createClient = (ctx: NextPageContext) =>
  new ApolloClient({
    uri: "http://localhost:4000/graphql",
    credentials: "include",
    headers: {
      cookie:
        (typeof window === "undefined"
          ? ctx?.req?.headers.cookie
          : undefined) || "",
    },
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            me: {
              merge: false
            },
            sentences: {
              keyArgs: false,
              merge(
                existing: PaginatedSentences | undefined,
                incoming: PaginatedSentences
              ): PaginatedSentences {
                return {
                  ...incoming,
                  sentences: [
                    ...(existing?.sentences || []),
                    ...incoming.sentences,
                  ],
                };
              },
            },            
          },
        },
        User: {
          fields: {
            scores: {
              merge: false
            }
          }
        }
      },
    }),
  });

export const withApollo = createWithApollo(createClient);
