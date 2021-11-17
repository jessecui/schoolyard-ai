import { Request, Response } from "express";
import { Redis } from "ioredis";
import { InputType, Field } from "type-graphql";
import { createQuestionVoteLoader } from "./utils/createQuestionVoteLoader";
import { createSentenceVoteLoader } from "./utils/createSentenceVoteLoader";
import { createUserLoader } from "./utils/createUserLoader";

// Declares the format of the cookie passed into the Express session
declare global {
  namespace Express {
    interface SessionData {
      cookie: any;
      userId: number;
    }
  }
}

export type MyContext = {
  req: Request & { session: Express.SessionData };
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
  questionVoteLoader: ReturnType<typeof createQuestionVoteLoader>;
  sentenceVoteLoader: ReturnType<typeof createSentenceVoteLoader>;
};

@InputType()
export class RegisterUserInputs {
  @Field()
  email: string;
  @Field()
  firstName: string;
  @Field()
  lastName: string;
  @Field()
  password: string;
}
