import DataLoader from "dataloader";
import { Sentence } from "../../entities/Sentence";

/*
A function that will load all sentences with one combined SQL command instead of
one for each sentence, given a list of sentence IDs to fetch.
*/

export const createSentenceLoader = () =>
  new DataLoader<number, Sentence>(async (sentenceIds) => {
    const sentences = await Sentence.findByIds(sentenceIds as number[]);
    const sentenceIdToSentence: Record<number, Sentence> = {};
    sentences.forEach((u) => {
      sentenceIdToSentence[u.id] = u;
    });

    return sentenceIds.map((sentenceId) => sentenceIdToSentence[sentenceId]);
  });
