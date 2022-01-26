import DataLoader from "dataloader";
import { QuestionVote } from "../../entities/QuestionVote";

export const createQuestionVoteLoader = () =>
  new DataLoader<{ questionId: number; userId: number }, QuestionVote | null>(
    async (keys) => {
      const votes = await QuestionVote.findByIds(keys as any);
      const voteIdsToQuestionVote: Record<string, QuestionVote> = {};
      votes.forEach((vote) => {
        voteIdsToQuestionVote[`${vote.userId}|${vote.questionId}`] = vote;
      });

      return keys.map(
        (key) => voteIdsToQuestionVote[`${key.userId}|${key.questionId}`]
      );
    }
  );
