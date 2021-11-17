import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types";


// Ensures that the user is authenticated
export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error("No user authenticated");
  }

  return next();
};
