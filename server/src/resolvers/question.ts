import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { EntityManager, getConnection, UpdateResult } from "typeorm";
import { Question, QuestionType } from "../entities/Question";
import { QuestionVote, VoteType } from "../entities/QuestionVote";
import { QuestionView } from "../entities/QuestionView";
import { Sentence } from "../entities/Sentence";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";

@InputType()
class QuestionInput {
  @Field({ nullable: true })
  question: string;
  @Field(() => [String], { nullable: true })
  subjects: string[];
  @Field(() => QuestionType, { nullable: true })
  questionType: QuestionType;
  @Field(() => [String], { nullable: true })
  choices: string[];
  @Field(() => [String], { nullable: true })
  answer: string[];
  @Field({ nullable: true })
  sentenceId: number;
}

@ObjectType()
class PaginatedQuestions {
  @Field(() => [Question])
  questions: Question[];
  @Field()
  hasMore: boolean;
}

@Resolver(Question)
export class QuestionResolver {
  @FieldResolver(() => User)
  teacher(@Root() question: Question, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(question.teacherId);
  }

  @FieldResolver(() => Sentence)
  sentence(@Root() question: Question) {
    return Sentence.findOneOrFail(question.sentenceId);
  }

  @FieldResolver(() => VoteType, { nullable: true })
  async userVoteType(
    @Root() question: Question,
    @Ctx() { questionVoteLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }

    const vote = await questionVoteLoader.load({
      questionId: question.id,
      userId: req.session.userId,
    });

    return vote ? vote.voteType : null;
  }

  @Mutation(() => Question)
  @UseMiddleware(isAuth)
  async createQuestion(
    @Ctx() { req }: MyContext,
    @Arg("questionInput") questionInput: QuestionInput
  ): Promise<Question> {
    if (
      questionInput.choices &&
      !questionInput.answer.every((val) => questionInput.choices.includes(val))
    ) {
      throw new Error("Answer must be one of the provided choices");
    }
    const rawResult = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Question)
      .values({
        ...questionInput,
        teacherId: req.session.userId,
      })
      .returning("*")
      .execute();

    return rawResult.raw[0];
  }

  @Query(() => Question, { nullable: true })
  question(@Arg("id", () => Int) id: number): Promise<Question | undefined> {
    return Question.findOne(id);
  }

  @Query(() => PaginatedQuestions)
  async questions(
    @Arg("limit", () => Int, { defaultValue: 10 }) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedQuestions> {
    const realLimit = Math.min(100, limit);
    const realLimitPlusOne = realLimit + 1;

    const parameters: any[] = [realLimitPlusOne];
    if (cursor) {
      parameters.push(new Date(parseInt(cursor)));
    }

    const questions = await getConnection().query(
      `
      select q.*
      from question q
      ${cursor ? `where q."createdAt" < $2` : ""}
      order by q."createdAt" DESC
      limit $1
    `,
      parameters
    );

    return {
      questions: questions.slice(0, realLimit),
      hasMore: questions.length === realLimitPlusOne,
    };
  }

  @Mutation(() => Question, { nullable: true })
  @UseMiddleware(isAuth)
  async updateQuestion(
    @Arg("id", () => Int) id: number,
    @Arg("questionInput", () => QuestionInput) questionInput: QuestionInput,
    @Ctx() { req }: MyContext
  ): Promise<Question | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Question)
      .set({ ...questionInput })
      .where("id = :id and teacherId = :teacherId", {
        id,
        teacherId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteQuestion(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    await Question.delete({ id, teacherId: req.session.userId });
    return true;
  }

  @Mutation(() => Question)
  @UseMiddleware(isAuth)
  async addVote(
    @Arg("questionId", () => Int) questionId: number,
    @Arg("voteType", () => VoteType) voteType: VoteType,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;
    const existingVote = await QuestionVote.findOne({
      where: { questionId, userId },
    });

    const changeQuestionVoteCount = async (
      manager: EntityManager,
      questionId: number,
      voteType: VoteType,
      increment: Boolean
    ) => {
      const updatedQuestion = await manager
        .createQueryBuilder()
        .update(Question)
        .set(
          voteType == VoteType.UP
            ? {
                upVoteCount: () =>
                  '"upVoteCount"' + (increment ? "+" : "-") + "1",
              }
            : voteType == VoteType.DOWN
            ? {
                downVoteCount: () =>
                  '"downVoteCount"' + (increment ? "+" : "-") + "1",
              }
            : {}
        )
        .where("id = :questionId", {
          questionId,
        })
        .returning("*")
        .execute();

      return updatedQuestion.raw[0];
    };

    let updatedQuestionToSend;

    if (!existingVote) {
      await getConnection().transaction(async (manager) => {
        await manager
          .createQueryBuilder()
          .insert()
          .into(QuestionVote)
          .values({
            userId,
            questionId,
            voteType: voteType,
          })
          .execute();
        updatedQuestionToSend = changeQuestionVoteCount(
          manager,
          questionId,
          voteType,
          true
        );
      });
    } else {
      // Remove Original Vote from QuestionVote database
      await getConnection().transaction(async (manager) => {
        await manager
          .createQueryBuilder()
          .delete()
          .from(QuestionVote)
          .where('"userId" = :userId and questionId = :questionId', {
            userId,
            questionId,
          })
          .execute();

        updatedQuestionToSend = changeQuestionVoteCount(
          manager,
          questionId,
          existingVote.voteType,
          false
        );

        // If new vote is different than existing vote, then add new vote
        if (existingVote.voteType != voteType) {
          await manager
            .createQueryBuilder()
            .insert()
            .into(QuestionVote)
            .values({
              userId,
              questionId,
              voteType: voteType,
            })
            .execute();

          updatedQuestionToSend = changeQuestionVoteCount(
            manager,
            questionId,
            voteType,
            true
          );
        }
      });
    }
    return updatedQuestionToSend;
  }

  @Mutation(() => Question, { nullable: true })
  async addView(
    @Arg("questionId", () => Int) questionId: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;
    let viewedQuestion: UpdateResult = new UpdateResult();
    if (userId) {
      const view = await QuestionView.findOne({
        where: { questionId, userId },
      });
      if (!view) {
        // Only one view per question for each user
        await getConnection().transaction(async (manager) => {
          await manager
            .createQueryBuilder()
            .insert()
            .into(QuestionView)
            .values({
              userId,
              questionId,
            })
            .execute();
          viewedQuestion = await manager
            .createQueryBuilder()
            .update(Question)
            .set({ viewCount: () => '"viewCount" + 1' })
            .where("id = :questionId", {
              questionId,
            })
            .returning("*")
            .execute();
        });
        return viewedQuestion.raw[0];
      } else {
        return null;
      }
    } else {
      // For non-authenticated users, we can just add to the view count
      viewedQuestion = await getConnection()
        .createQueryBuilder()
        .update(Question)
        .set({ viewCount: () => '"viewCount" + 1' })
        .where("id = :questionId", {
          questionId,
        })
        .returning("*")
        .execute();
    }
  }
}
