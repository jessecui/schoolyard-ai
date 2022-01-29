import { Request, Response } from "express";
import { Redis } from "ioredis";
import { Field, InputType, registerEnumType } from "type-graphql";
import { createQuestionVoteLoader } from "./utils/loaders/createQuestionVoteLoader";
import { createSentenceVoteLoader } from "./utils/loaders/createSentenceVoteLoader";
import { createUserLoader } from "./utils/loaders/createUserLoader";
import { createSentenceLoader } from "./utils/loaders/createSentenceLoader";

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
  sentenceLoader: ReturnType<typeof createSentenceLoader>;
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

export enum VoteType {
  UP = 1,
  DOWN = -1,
}
registerEnumType(VoteType, { name: "VoteType" });
