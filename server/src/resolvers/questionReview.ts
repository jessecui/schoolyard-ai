import { FieldResolver, Resolver, Root } from "type-graphql";
import { Question } from "../entities/Question";
import { QuestionReview } from "../entities/QuestionReview";

@Resolver(QuestionReview)
export class QuestionReviewResolver {
  @FieldResolver(() => Question)
  async question(@Root() questionReview: QuestionReview) {
    return await Question.findOne(questionReview.questionId);
  }
}