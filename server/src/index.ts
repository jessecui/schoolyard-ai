import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import "dotenv-safe/config";
import express from "express";
import session from "express-session";
import { graphqlUploadExpress } from "graphql-upload";
import Redis from "ioredis";
import path from "path";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { COOKIE_NAME, IS_PROD } from "./constants";
import { Cloning } from "./entities/Cloning";
import { ParentChild } from "./entities/ParentChild";
import { Question } from "./entities/Question";
import { QuestionReview } from "./entities/QuestionReview";
import { QuestionSubject } from "./entities/QuestionSubject";
import { QuestionView } from "./entities/QuestionView";
import { QuestionVote } from "./entities/QuestionVote";
import { Score } from "./entities/Score";
import { Sentence } from "./entities/Sentence";
import { SentenceSubject } from "./entities/SentenceSubject";
import { SentenceView } from "./entities/SentenceView";
import { SentenceVote } from "./entities/SentenceVote";
import { Subject } from "./entities/Subject";
import { User } from "./entities/User";
import { Word } from "./entities/Word";
import { getFileStream, ProfilePhotoResolver } from "./resolvers/profilePhoto";
import { QuestionResolver } from "./resolvers/question";
import { QuestionReviewResolver } from "./resolvers/questionReview";
import { SentenceResolver } from "./resolvers/sentence";
import { SentenceViewResolver } from "./resolvers/sentenceView";
import { UserResolver } from "./resolvers/user";
import { createQuestionVoteLoader } from "./utils/loaders/createQuestionVoteLoader";
import { createSentenceLoader } from "./utils/loaders/createSentenceLoader";
import { createSentenceVoteLoader } from "./utils/loaders/createSentenceVoteLoader";
import { createUserLoader } from "./utils/loaders/createUserLoader";

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
  Word,
];
const resolvers = [
  UserResolver,
  SentenceResolver,
  QuestionResolver,
  QuestionReviewResolver,
  SentenceViewResolver,
  ProfilePhotoResolver,
];

// Also make sure to update MyContext type in types.ts
const loaders = {
  userLoader: createUserLoader(),
  sentenceLoader: createSentenceLoader(),
  questionVoteLoader: createQuestionVoteLoader(),
  sentenceVoteLoader: createSentenceVoteLoader(),
};

const main = async () => {
  // Set up a connection to the database with TypeORM
  const conn = await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: ["error", "schema", "warn", "info", "log"],
    synchronize: false,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities,
  });

  // Set up initial migrations
  await conn.runMigrations();

  // Set up a connection to Redis for user authentication cookie management
  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  // Set up express router with CORS handling
  const app = express();
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );

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
        domain: IS_PROD ? ".goschoolyard.com" : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
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

  app.use(graphqlUploadExpress());

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, cors: false });

  app.get("/images/:key", (req, res) => {
    const readStream = getFileStream(req.params.key).on("error", () => {
      res.status(404).send("Photo not found");
    });
    readStream.pipe(res);
  });

  // Start the server on port 4000
  app.listen(parseInt(process.env.PORT), () => {
    console.log("Server started on localhost:", process.env.PORT);
  });
};

main().catch((err) => {
  console.error(err);
});
