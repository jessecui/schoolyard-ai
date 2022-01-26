import DataLoader from "dataloader";
import { SentenceVote } from "../../entities/SentenceVote";

export const createSentenceVoteLoader = () =>
  new DataLoader<{ sentenceId: number; userId: number }, SentenceVote | null>(
    async (keys) => {
      const votes = await SentenceVote.findByIds(keys as any);
      const voteIdsToSentenceVote: Record<string, SentenceVote> = {};
      votes.forEach((vote) => {
        voteIdsToSentenceVote[`${vote.userId}|${vote.sentenceId}`] = vote;
      });

      return keys.map(
        (key) => voteIdsToSentenceVote[`${key.userId}|${key.sentenceId}`]
      );
    }
  );
