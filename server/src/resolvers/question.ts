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
import {
  createQueryBuilder,
  EntityManager,
  getConnection,
  UpdateResult,
} from "typeorm";
import { Question, QuestionType } from "../entities/Question";
import { QuestionVote } from "../entities/QuestionVote";
import { QuestionView } from "../entities/QuestionView";
import { Sentence } from "../entities/Sentence";
import { User } from "../entities/User";
import { isAuth } from "../utils/isAuth";
import { MyContext } from "../types";
import { QuestionSubject } from "../entities/QuestionSubject";
import { Subject } from "../entities/Subject";
import { SentenceSubject } from "../entities/SentenceSubject";
import { VoteType } from "../types";
import { QuestionReview, ReviewStatus } from "../entities/QuestionReview";
import { Score } from "../entities/Score";

@InputType()
class QuestionInput {
  @Field({ nullable: true })
  question: string;
  @Field(() => [String], { nullable: true })
  subjects: string[];
  @Field(() => QuestionType, { nullable: true })
  questionType: QuestionType;
  @Field(() => [String], { nullable: true })
  choices: string[] | undefined;
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

const insertQuestionSubjects = async (
  subjects: string[],
  questionId: number,
  update: boolean
) => {
  if (update) {
    await QuestionSubject.delete({ questionId });
  }
  await getConnection().transaction(async (manager) => {
    await Promise.all(
      subjects.map(async (subjectName, index) => {
        subjectName = subjectName.trim().toLowerCase();
        await manager
          .createQueryBuilder()
          .insert()
          .into(Subject)
          .values({ subjectName })
          .orIgnore()
          .execute();
        await manager
          .createQueryBuilder()
          .insert()
          .into(QuestionSubject)
          .values({ questionId, subjectName, order: index })
          .orIgnore()
          .execute();
      })
    );
  });
};

const checkSubjectsAndDelete = async (subjects: string[]) => {
  await Promise.all(
    subjects.map(async (subject) => {
      subject = subject.trim().toLowerCase();
      const questionCounts = await QuestionSubject.count({
        subjectName: subject,
      });
      const sentenceCounts = await SentenceSubject.count({
        subjectName: subject,
      });
      if (!questionCounts && !sentenceCounts) {
        await Subject.delete({ subjectName: subject });
      }
    })
  );
};

@Resolver(Question)
export class QuestionResolver {
  @FieldResolver(() => User)
  creator(@Root() question: Question, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(question.creatorId);
  }

  @FieldResolver(() => Sentence)
  sentence(@Root() question: Question) {
    if (!question.sentenceId) {
      return;
    }
    return Sentence.findOne(question.sentenceId);
  }

  @FieldResolver(() => [String])
  async subjects(@Root() question: Sentence) {
    const subjects = await QuestionSubject.find({
      where: { questionId: question.id },
      skip: 0,
      take: 10,
      order: {
        order: "ASC",
      },
    });
    return subjects.map((subject) => subject.subjectName);
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
      (questionInput.questionType == QuestionType.SINGLE ||
        questionInput.questionType == QuestionType.MULTIPLE) &&
      !questionInput.answer.every((val) => questionInput.choices!.includes(val))
    ) {
      throw new Error("Answer must be one of the provided choices");
    }
    if (questionInput.questionType == QuestionType.TEXT) {
      questionInput.choices = undefined;
    }
    const { subjects, ...otherInputs } = questionInput;
    const rawResult = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Question)
      .values({
        ...otherInputs,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    const result = rawResult.raw[0] as Question;
    insertQuestionSubjects(subjects, result.id, false);
    return result;
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
    if (
      (questionInput.questionType == QuestionType.SINGLE ||
        questionInput.questionType == QuestionType.MULTIPLE) &&
      !questionInput.answer.every((val) => questionInput.choices!.includes(val))
    ) {
      throw new Error("Answer must be one of the provided choices");
    }
    if (questionInput.questionType == QuestionType.TEXT) {
      questionInput.choices = undefined;
    }
    const { subjects, ...otherInputs } = questionInput;
    const rawResult = await getConnection()
      .createQueryBuilder()
      .update(Question)
      .set({ ...otherInputs })
      .where("id = :id and creatorId = :creatorId", {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    const result = rawResult.raw[0] as Question;
    insertQuestionSubjects(subjects, result.id, true);
    return result;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteQuestion(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // Retrieve subjects
    const subjects = (
      await QuestionSubject.find({
        where: { questionId: id },
        skip: 0,
        take: 10,
      })
    ).map((questionSubject) => questionSubject.subjectName);    

    // Check all users with question available in question reviews
    const questionReviewsToDelete = await QuestionReview.find({
      where: { questionId: id },
      skip: 0,
      take: 100,
    });

    questionReviewsToDelete.forEach(async (questionReview) => {
      // Subtract one from their scores
      subjects.forEach(async (subject) => {
        const newScoreResult = await createQueryBuilder()
          .update(Score)
          .where({ subjectName: subject, userId: questionReview.userId })
          .set(
            questionReview.reviewStatus == ReviewStatus.QUEUED
              ? { queued: () => "queued - 1" }
              : questionReview.reviewStatus == ReviewStatus.CORRECT
              ? { correct: () => "correct - 1" }
              : questionReview.reviewStatus == ReviewStatus.INCORRECT
              ? { incorrect: () => "incorrect - 1" }
              : {}
          )
          .returning("*")
          .execute();

        // Delete the subject score for user if there are no reviews
        // Check if all scores are 0. If so, delete the score.
        const newScore = newScoreResult.raw[0] as Score;
        if (
          newScore.queued <= 0 &&
          newScore.correct <= 0 &&
          newScore.incorrect <= 0
        ) {
          await createQueryBuilder()
            .delete()
            .from(Score)
            .where({
              subjectName: subject,
              userId: questionReview.userId,
            })
            .execute();
        }
      });

      // Delete the review
      await createQueryBuilder().delete().from(QuestionReview).where({
        userId: questionReview.userId,
        questionId: questionReview.questionId,
      });
    });

    // Delete the question and any subjects that depend on the question
    await Question.delete({ id, creatorId: req.session.userId });
    await checkSubjectsAndDelete(subjects);

    return true;
  }

  @Mutation(() => Question)
  @UseMiddleware(isAuth)
  async addQuestionVote(
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
  async addQuestionView(
    @Arg("questionId", () => Int) questionId: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;
    let viewedQuestion: UpdateResult = new UpdateResult();
    if (userId) {
      const view = await QuestionView.findOne({
        where: { questionId, userId },
      });
      await getConnection().transaction(async (manager) => {
        if (!view) {
          await manager
            .createQueryBuilder()
            .insert()
            .into(QuestionView)
            .values({
              userId,
              questionId,
              userViewCount: 1,
            })
            .execute();
        } else {
          await manager
            .createQueryBuilder()
            .update(QuestionView)
            .set({ userViewCount: () => '"userViewCount" + 1' })
            .where("userId = :userId and questionId = :questionId", {
              userId,
              questionId,
            })
            .execute();
        }
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
      // For non-authenticated users, we can just add to the view count
      viewedQuestion = await getConnection()
        .createQueryBuilder()
        .update(Sentence)
        .set({ viewCount: () => '"viewCount" + 1' })
        .where("id = :questionId", {
          questionId,
        })
        .returning("*")
        .execute();
    }
  }
}
