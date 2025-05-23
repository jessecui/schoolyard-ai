import { ApolloClient, InMemoryCache } from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { NextPageContext } from "next";
import { PaginatedSentences } from "../graphql/generated/graphql";
import { createWithApollo } from "./createWithApollo";

const createClient = (ctx: NextPageContext) =>
  new ApolloClient({
    link: createUploadLink({
      uri: process.env.NEXT_PUBLIC_API_URL,
      credentials: "include",
      headers: {
        cookie:
          (typeof window === "undefined"
            ? ctx?.req?.headers.cookie
            : undefined) || "",
      },
    }),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            me: {
              merge: false,
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
              merge: false,
            },
          },
        },
      },
    }),
  });

export const withApollo = createWithApollo(createClient);
