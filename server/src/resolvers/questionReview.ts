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
    return  questionReview;
  }

  @Mutation(() => QuestionReview)
  async createQuestionReview(
    @Arg("questionId", () => Int) questionId: number,
    @Arg("reviewStatus", () => ReviewStatus) reviewStatus: ReviewStatus,
    @Ctx() { req }: MyContext
  ) {
    const today = new Date();
    let tomorrow = new Date();
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    let afterTomorrow = new Date();
    afterTomorrow.setUTCDate(today.getUTCDate() + 2);
    const review = await getConnection()
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
    return review.raw[0];
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
      let correctStreak;
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
      return review.raw[0];
    }
    return null;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteQuestionReview(
    @Arg("questionId", () => Int) questionId: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    await QuestionReview.delete({ userId: req.session.userId, questionId });
    return true;
  }
}
