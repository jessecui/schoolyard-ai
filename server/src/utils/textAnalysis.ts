import { createQueryBuilder, getConnection } from "typeorm";
// import w2v from "word2vec";
import { CloneType, Cloning } from "../entities/Cloning";
import { ParentChild } from "../entities/ParentChild";
import { Sentence } from "../entities/Sentence";
import { Word } from "../entities/Word";

export async function getSentenceEmbedding(sentence: string) {
  const words = sentence.split(/\W+/);
  let sumEmbedding = Array(100).fill(0);
  let numWordsWithEmbedding = 0;
  for (const word of words) {
    const word2Vec = await Word.findOne(word);
    const embedding = word2Vec?.embedding;
    if (embedding) {
      numWordsWithEmbedding += 1;
      sumEmbedding = sumEmbedding.map((num, idx) => {
        return num + embedding[idx];
      });
    }
  }
  return numWordsWithEmbedding
    ? sumEmbedding.map((element) => element / numWordsWithEmbedding)
    : [];
}

export function getDistance(a: number[], b: number[]) {
  return (
    a
      .map((x, i) => Math.abs(x - b[i]) ** 2) // square the difference
      .reduce((sum, now) => sum + now) ** // sum
    (1 / 2)
  );
}

export async function insertDistances(sentenceId: number) {
  // Retrieve the sentence embedding
  const sentence = await Sentence.findOneOrFail(sentenceId);
  if (!sentence) {
    return;
  }
  const sentenceEmbedding = sentence.embedding;

  if (!sentenceEmbedding.length) {
    return;
  }

  // Loop through all sentences in the corpus
  let sentences: Sentence[] = await Sentence.find();

  // Filter sentences for full length vectors
  sentences = sentences.filter((sentence) => sentence.embedding.length);

  // Make sure we do not clone parent to children or siblings
  let invalidIds: number[] = [];
  const parentRelationship = await ParentChild.findOne({
    where: { childId: sentenceId },
  });
  if (parentRelationship) {
    invalidIds.push(parentRelationship.parentId);

    const siblingRelationships = await ParentChild.find({
      where: { parentId: parentRelationship?.parentId },
    });
    siblingRelationships.forEach((relationship) => {
      invalidIds.push(relationship.childId);
    });
  }
  const childrenRelationships = await ParentChild.find({
    where: { parentId: sentenceId },
  });
  childrenRelationships.forEach((relationship) => {
    invalidIds.push(relationship.childId);
  });
  sentences = sentences.filter((sentence) => {
    return !invalidIds.includes(sentence.id) && sentenceId != sentence.id;
  });

  // Insert or update the distance into the cloning table
  for (const otherSentence of sentences) {
    if (sentenceId == otherSentence.id) {
      continue;
    }
    const distance = getDistance(sentenceEmbedding, otherSentence.embedding);
    const asOlderClone = await Cloning.findOne({
      where: { olderCloneId: sentenceId, youngerCloneId: otherSentence.id },
    });
    if (asOlderClone) {
      if (asOlderClone.cloneType == CloneType.AUTO) {
        await createQueryBuilder()
          .update(Cloning)
          .set({ distance })
          .where(
            "olderCloneId = :olderCloneId and youngerCloneId = :youngerCloneId",
            {
              olderCloneId: asOlderClone.olderCloneId,
              youngerCloneId: asOlderClone.youngerCloneId,
            }
          )
          .execute();
      }
    } else {
      const asYoungerClone = await Cloning.findOne({
        where: { olderCloneId: otherSentence.id, youngerCloneId: sentenceId },
      });
      if (asYoungerClone) {
        if (asYoungerClone.cloneType == CloneType.AUTO) {
          await createQueryBuilder()
            .update(Cloning)
            .set({ distance })
            .where(
              "olderCloneId = :olderCloneId and youngerCloneId = :youngerCloneId",
              {
                olderCloneId: asYoungerClone.olderCloneId,
                youngerCloneId: asYoungerClone.youngerCloneId,
              }
            )
            .execute();
        }
      } else {
        let olderCloneId;
        let youngerCloneId;
        if (sentence.createdAt.getTime() > otherSentence.createdAt.getTime()) {
          olderCloneId = otherSentence.id;
          youngerCloneId = sentenceId;
        } else {
          olderCloneId = otherSentence.id;
          youngerCloneId = sentenceId;
        }
        await getConnection()
          .createQueryBuilder()
          .insert()
          .into(Cloning)
          .values({
            olderCloneId,
            youngerCloneId,
            distance: distance,
            cloneType: CloneType.AUTO,
          })
          .execute();
      }
    }
  }
}
