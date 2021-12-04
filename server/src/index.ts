import connectRedis from "connect-redis";
import Redis from "ioredis";
import express from "express";
import path from "path";
import { createConnection } from "typeorm";
import session from "express-session";
import cors from "cors";
import { COOKIE_NAME, IS_PROD } from "./constants";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/user";
import { User } from "./entities/User";
import { SentenceResolver } from "./resolvers/sentence";
import { Sentence } from "./entities/Sentence";
import { SentenceVote } from "./entities/SentenceVote";
import { QuestionVote } from "./entities/QuestionVote";
import { Question } from "./entities/Question";
import { QuestionResolver } from "./resolvers/question";
import { createUserLoader } from "./utils/createUserLoader";
import { QuestionView } from "./entities/QuestionView";
import { createQuestionVoteLoader } from "./utils/createQuestionVoteLoader";
import { ParentChild } from "./entities/ParentChild";
import { SentenceView } from "./entities/SentenceView";
import { createSentenceVoteLoader } from "./utils/createSentenceVoteLoader";
import { Cloning } from "./entities/Cloning";
import { QuestionReview } from "./entities/QuestionReview";
import { QuestionReviewResolver } from "./resolvers/questionReview";
import { SentenceSubject } from "./entities/SentenceSubject";
import { Subject } from "./entities/Subject";
import { Score } from "./entities/Score";
import { QuestionSubject } from "./entities/QuestionSubject";
import { SentenceViewResolver } from "./resolvers/sentenceView";

// Update these variables upon adding new entities and resolvers
const entities = [
  User,
  Sentence,
  SentenceVote,
  SentenceView,
  Question,
  QuestionVote,
  QuestionView,
  QuestionReview,
  ParentChild,
  Cloning,
  Subject,  
  SentenceSubject,
  QuestionSubject,
  Score,
];
const resolvers = [
  UserResolver,
  SentenceResolver,
  QuestionResolver,
  QuestionReviewResolver,
  SentenceViewResolver
];

// Also make sure to update MyContext type in types.ts
const loaders = {
  userLoader: createUserLoader(),
  questionVoteLoader: createQuestionVoteLoader(),
  sentenceVoteLoader: createSentenceVoteLoader(),
};

const main = async () => {
  const database_name = "schoolyard_dev_v2";

  // Set up a connection to the database with TypeORM
  const conn = await createConnection({
    type: "postgres",
    url: "postgresql://postgres:postgres@localhost:5432/" + database_name,
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities,
  });

  // Set up initial migrations
  await conn.runMigrations();

  // Set up express router with CORS handling
  const app = express();
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  // Set up a connection to Redis for user authentication cookie management
  const RedisStore = connectRedis(session);
  const redis = new Redis("127.0.0.1:6379");

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        sameSite: "lax", // CSRF prevention
        secure: IS_PROD, // Cookie only works in https
      },
      saveUninitialized: false,
      secret: "dfsa12wer8gf45",
      resave: false,
    })
  );

  // Set up an Apollo server for handling GraphQL requests
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: resolvers as any,
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      ...loaders,
    }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, cors: false });

  // Start the server on port 4000
  app.listen(4000, () => {
    console.log("Server started on localhost:4000");
  });
};

main().catch((err) => {
  console.error(err);
});
