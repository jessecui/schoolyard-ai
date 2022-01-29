import { createQueryBuilder, getConnection } from "typeorm";
import w2v from "word2vec";
import { Cloning } from "../../entities/Cloning";
import { ParentChild } from "../../entities/ParentChild";
import { Sentence } from "../../entities/Sentence";

var w2vModel: any;

w2v.loadModel(__dirname + "/word2vec.txt", (error: any, model: any) => {
  if (error) {
    console.log(error);
  } else {
    w2vModel = model;
  }
});

export function getSentenceEmbedding(sentence: string) {
  const words = sentence.split(/\W+/);
  let sumEmbedding = Array(100).fill(0);
  words.forEach((word) => {
    const embedding = w2vModel.getVector(word);
    if (embedding) {
      sumEmbedding = sumEmbedding.map((num, idx) => {
        return num + embedding.values[idx];
      });
    }
  });

  return sumEmbedding.map((embedding) => embedding / words.length);
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

  // Loop through all sentences in corpus with children
  let sentences: Sentence[] = await getConnection().query(
    `
    select distinct(s.*)
    from sentence s join parent_child pc
    on s.id = pc."parentId"
  `
  );

  // Check that sentence is not a child or parent of the other sentence
  let invalidIds: number[] = [];
  const parentRelationship = await ParentChild.findOne({
    where: { childId: sentenceId },
  });
  if (parentRelationship) {
    invalidIds.push(parentRelationship.parentId);
  }
  const childrenRelationships = await ParentChild.find({
    where: { parentId: sentenceId },
  });
  childrenRelationships.forEach((relationship) => {
    invalidIds.push(relationship.childId);
  });
  sentences = sentences.filter((sentence) => {
    return !invalidIds.includes(sentence.id);
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
      if (asOlderClone.distance != -1) {
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
        if (asYoungerClone.distance != -1) {
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
          .values({ olderCloneId, youngerCloneId, distance: distance })
          .execute();
      }
    }
  }
}
