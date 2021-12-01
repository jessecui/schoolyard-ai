import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Question } from "../entities/Question";
import { QuestionReview, ReviewStatus } from "../entities/QuestionReview";
import { QuestionSubject } from "../entities/QuestionSubject";
import { Score } from "../entities/Score";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";

@Resolver(QuestionReview)
export class QuestionReviewResolver {
  @FieldResolver(() => Question)
  async question(@Root() questionReview: QuestionReview) {
    return await Question.findOne(questionReview.questionId);
  }

  @Query(() => QuestionReview, { nullable: true })
  async questionReview(
    @Arg("questionId", () => Int) questionId: number,
    @Ctx() { req }: MyContext
  ): Promise<QuestionReview | undefined> {
    const questionReview = await QuestionReview.findOne({
      where: {
        questionId,
        userId: req.session.userId,
      },
    });
    return questionReview;
  }

  @Mutation(() => QuestionReview, { nullable: true })
  async createQuestionReview(
    @Arg("questionId", () => Int) questionId: number,
    @Arg("reviewStatus", () => ReviewStatus) reviewStatus: ReviewStatus,
    @Ctx() { req }: MyContext
  ) {
    const existingQuestionReview = await QuestionReview.findOne({
      questionId,
      userId: req.session.userId,
    });
    if (existingQuestionReview) {
      return null;
    }

    const today = new Date();
    let tomorrow = new Date();
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    let afterTomorrow = new Date();
    afterTomorrow.setUTCDate(today.getUTCDate() + 2);
    let review = new QuestionReview();
    await getConnection().transaction(async (manager) => {
      const rawReview = await manager
        .createQueryBuilder()
        .insert()
        .into(QuestionReview)
        .values({
          userId: req.session.userId,
          questionId,
          reviewStatus,
          correctStreak: reviewStatus == ReviewStatus.CORRECT ? 1 : 0,
          dateNextAvailable:
            reviewStatus == ReviewStatus.INCORRECT
              ? new Date(tomorrow)
              : reviewStatus == ReviewStatus.CORRECT
              ? new Date(afterTomorrow)
              : today,
        })
        .returning("*")
        .execute();
      review = rawReview.raw[0];

      const questionSubjects = await QuestionSubject.find({
        where: { questionId },
        skip: 0,
        take: 10,
      });
      const subjects = questionSubjects.map((subject) => subject.subjectName);
      if (subjects) {
        await Promise.all(
          subjects.map(async (subject) => {
            const existingScore = await Score.findOne({
              subjectName: subject,
              userId: req.session.userId,
            });
            if (!existingScore) {
              await manager
                .createQueryBuilder()
                .insert()
                .into(Score)
                .values({
                  subjectName: subject,
                  userId: req.session.userId,
                  queued: reviewStatus == ReviewStatus.QUEUED ? 1 : 0,
                  correct: reviewStatus == ReviewStatus.CORRECT ? 1 : 0,
                  incorrect: reviewStatus == ReviewStatus.INCORRECT ? 1 : 0,
                })
                .execute();
            } else {
              await manager
                .createQueryBuilder()
                .update(Score)
                .where({ subjectName: subject, userId: req.session.userId })
                .set(
                  reviewStatus == ReviewStatus.QUEUED
                    ? { queued: () => "queued + 1" }
                    : reviewStatus == ReviewStatus.CORRECT
                    ? { correct: () => "correct + 1" }
                    : reviewStatus == ReviewStatus.INCORRECT
                    ? { incorrect: () => "incorrect + 1" }
                    : {}
                )
                .execute();
            }
          })
        );
      }
    });
    return review;
  }

  @Mutation(() => QuestionReview, { nullable: true })
  async updateQuestionReview(
    @Arg("questionId", () => Int) questionId: number,
    @Arg("reviewStatus", () => ReviewStatus) reviewStatus: ReviewStatus,
    @Ctx() { req }: MyContext
  ) {
    const existingReview = await QuestionReview.findOne({
      where: { userId: req.session.userId, questionId },
    });
    if (existingReview) {
      if (
        new Date().getTime() <
        new Date(existingReview.dateNextAvailable).getTime()
      ) {
        return null;
      }
      let correctStreak: number;
      let dateNextAvailable = new Date();
      if (reviewStatus == ReviewStatus.CORRECT) {
        correctStreak = existingReview.correctStreak + 1;
        dateNextAvailable.setDate(
          dateNextAvailable.getDate() + correctStreak * 2
        );
      } else if (reviewStatus == ReviewStatus.INCORRECT) {
        correctStreak = 0;
        dateNextAvailable.setDate(
          dateNextAvailable.getDate() + correctStreak + 1
        );
      } else {
        return null;
      }

      await getConnection().transaction(async (manager) => {
        const review = await getConnection()
          .createQueryBuilder()
          .update(QuestionReview)
          .set({
            reviewStatus,
            correctStreak,
            dateNextAvailable,
          })
          .where("userId = :userId and questionId = :questionId", {
            userId: req.session.userId,
            questionId,
          })
          .returning("*")
          .execute();

        const questionSubjects = await QuestionSubject.find({
          where: { questionId },
          skip: 0,
          take: 10,
        });
        const subjects = questionSubjects.map((subject) => subject.subjectName);
        if (subjects && existingReview.reviewStatus != reviewStatus) {
          await Promise.all(
            subjects.map(async (subject) => {
              await manager
                .createQueryBuilder()
                .update(Score)
                .where({ subjectName: subject, userId: req.session.userId })
                .set({
                  queued:
                    existingReview.reviewStatus == ReviewStatus.QUEUED
                      ? () => "queued - 1"
                      : () => "queued",
                  correct:
                    existingReview.reviewStatus == ReviewStatus.CORRECT
                      ? () => "correct - 1"
                      : reviewStatus == ReviewStatus.CORRECT
                      ? () => "correct + 1"
                      : () => "correct",
                  incorrect:
                    existingReview.reviewStatus == ReviewStatus.INCORRECT
                      ? () => "incorrect - 1"
                      : reviewStatus == ReviewStatus.INCORRECT
                      ? () => "incorrect + 1"
                      : () => "incorrect",
                })
                .execute();
            })
          );
        }
        return review.raw[0];
      });
    }
    return null;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteQuestionReview(
    @Arg("questionId", () => Int) questionId: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    const questionReview = await QuestionReview.findOne({
      userId: req.session.userId,
      questionId,
    });

    await getConnection().transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(QuestionReview)
        .where({ userId: req.session.userId, questionId })
        .execute();

      const questionSubjects = await QuestionSubject.find({
        where: { questionId },
        skip: 0,
        take: 10,
      });
      const subjects = questionSubjects.map((subject) => subject.subjectName);

      if (subjects) {
        await Promise.all(
          subjects.map(async (subject) => {
            // Check the review status
            const reviewStatus = questionReview?.reviewStatus;

            // Check if existing correct score column is > 0
            const score = await Score.findOne({
              subjectName: subject,
              userId: req.session.userId,
            });

            if (score) {
              const key =
                reviewStatus == ReviewStatus.QUEUED
                  ? "queued"
                  : reviewStatus == ReviewStatus.CORRECT
                  ? "correct"
                  : reviewStatus == ReviewStatus.INCORRECT
                  ? "incorrect"
                  : "";

              if (key) {
                const existingScoreValue = score[key];
                if (existingScoreValue > 0) {
                  // If so, decremement column
                  const newScoreResult = await manager
                    .createQueryBuilder()
                    .update(Score)
                    .where({ subjectName: subject, userId: req.session.userId })
                    .set(
                      reviewStatus == ReviewStatus.QUEUED
                        ? { queued: () => "queued - 1" }
                        : reviewStatus == ReviewStatus.CORRECT
                        ? { correct: () => "correct - 1" }
                        : reviewStatus == ReviewStatus.INCORRECT
                        ? { incorrect: () => "incorrect - 1" }
                        : {}
                    )
                    .returning("*")
                    .execute();

                  // Check if all scores are 0. If so, delete the score.
                  const newScore = newScoreResult.raw[0] as Score;
                  if (
                    newScore.queued <= 0 &&
                    newScore.correct <= 0 &&
                    newScore.incorrect <= 0
                  ) {
                    await manager
                      .createQueryBuilder()
                      .delete()
                      .from(Score)
                      .where({
                        subjectName: subject,
                        userId: req.session.userId,
                      })
                      .execute();
                  }
                }
              }
            }
          })
        );
      }
    });
    return true;
  }
}
