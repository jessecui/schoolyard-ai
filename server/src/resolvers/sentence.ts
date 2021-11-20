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
  In,
  Not,
  UpdateResult,
} from "typeorm";
import { Cloning } from "../entities/Cloning";
import { ParentChild } from "../entities/ParentChild";
import { VoteType } from "../entities/QuestionVote";
import { Sentence } from "../entities/Sentence";
import { SentenceView } from "../entities/SentenceView";
import { SentenceVote } from "../entities/SentenceVote";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";

@InputType()
class ParagraphInput {
  @Field({ nullable: true })
  text: string;
  @Field(() => [String], { nullable: true })
  childrenText: string[];
  @Field(() => [String], { nullable: true })
  subjects: string[];
}

@ObjectType()
class PaginatedSentences {
  @Field(() => [Sentence])
  sentences: Sentence[];
  @Field()
  hasMore: boolean;
}

const bfsClones = async (
  sentences: Sentence[],
  visitedIds: number[]
): Promise<Sentence[]> => {
  // Filter sentences for visited sentences
  let unvisitedSentences = sentences.filter((sentence) => {
    return !visitedIds.includes(sentence.id);
  });

  if (unvisitedSentences.length == 0) {
    return sentences;
  }

  // Update visited IDs
  visitedIds = visitedIds.concat(
    unvisitedSentences.map((sentence) => sentence.id)
  );

  // For every unvisited sentence, grab its clones
  let newNeighbors = (
    await Promise.all(
      unvisitedSentences.map(async (sentence) => {
        const youngerCloneRelations = await createQueryBuilder(Cloning)
          .where(
            '"olderCloneId" = :olderCloneId AND "youngerCloneId" NOT IN (:...visitedIds)',
            { olderCloneId: sentence.id, visitedIds }
          )
          .getMany();

        const youngerClones = await Promise.all(
          youngerCloneRelations.map(async (relationship) => {
            return await Sentence.findOne(relationship.youngerCloneId);
          })
        );

        const olderCloneRelations = await createQueryBuilder(Cloning)
          .where(
            '"youngerCloneId" = :youngerCloneId AND "olderCloneId" NOT IN (:...visitedIds)',
            { youngerCloneId: sentence.id, visitedIds }
          )
          .getMany();

        const olderClones = await Promise.all(
          olderCloneRelations.map(async (relationship) => {
            return await Sentence.findOne(relationship.olderCloneId);
          })
        );

        let clones: Sentence[] = youngerClones
          .concat(olderClones)
          .filter(function (element) {
            return element !== undefined;
          }) as Sentence[];

        return clones;
      })
    )
  ).flat(1);

  // Now add all these new clones and recursively retrieve their neighbors
  const nextNeighbors = await bfsClones(newNeighbors, visitedIds);

  // Concat with next layer's neighbors
  let allVisitedSentences = sentences
    .concat(newNeighbors)
    .concat(nextNeighbors);

  // Deduplicate and return
  return allVisitedSentences.filter(
    (sentence, index, self) =>
      self.findIndex((s) => s.id === sentence.id) === index
  );
};

@Resolver(Sentence)
export class SentenceResolver {
  @FieldResolver(() => Sentence, { nullable: true })
  async parent(@Root() sentence: Sentence) {
    const parent = await ParentChild.findOne({
      where: { childId: sentence.id },
    });
    if (parent) {
      return await Sentence.findOne(parent?.parentId);
    }
    return null;
  }

  @FieldResolver(() => [Sentence], { nullable: true })
  async children(@Root() sentence: Sentence) {
    const relationships = await ParentChild.find({
      where: { parentId: sentence.id },
      skip: 0,
      take: 100,
    });
    let children = await Promise.all(
      relationships.map(async (relationship) => {
        return await Sentence.findOne(relationship.childId);
      })
    );
    children = children.filter(function (element) {
      return element !== undefined;
    });
    return children.length > 0 ? children : null;
  }

  @FieldResolver({ nullable: true })
  async orderNumber(@Root() sentence: Sentence) {
    const relationship = await ParentChild.findOne({
      where: { childId: sentence.id },
    });
    if (relationship) {
      return relationship?.orderNumber;
    }
    return null;
  }
  // Returns a list of the sentence and all of its clones
  @FieldResolver(() => [Sentence], { nullable: true })
  async clones(@Root() sentence: Sentence) {
    return (await bfsClones([sentence], [])).sort(
      (a, b) =>
        Math.abs(a.createdAt.getTime() - sentence.createdAt.getTime()) -
        Math.abs(b.createdAt.getTime() - sentence.createdAt.getTime())
    );
  }

  @FieldResolver(() => User)
  async teacher(@Root() sentence: Sentence) {
    const teacher = await User.findOne(sentence.teacherId);
    return teacher;
  }

  @FieldResolver(() => VoteType, { nullable: true })
  async userVoteType(
    @Root() sentence: Sentence,
    @Ctx() { sentenceVoteLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }

    const vote = await sentenceVoteLoader.load({
      sentenceId: sentence.id,
      userId: req.session.userId,
    });

    return vote ? vote.voteType : null;
  }

  @Mutation(() => Sentence)
  @UseMiddleware(isAuth)
  async createParagraph(
    @Ctx() { req }: MyContext,
    @Arg("paragraphInput", () => ParagraphInput) paragraphInput: ParagraphInput,
    @Arg("cloningOriginId", () => Int, { nullable: true })
    cloningOriginId: number
  ): Promise<Sentence> {
    const summarySentenceQuery = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Sentence)
      .values({
        text: paragraphInput.text,
        subjects: paragraphInput.subjects,
        teacherId: req.session.userId,
      })
      .returning("*")
      .execute();

    const newSummarySentence = summarySentenceQuery.raw[0];

    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Cloning)
      .values({
        olderCloneId: cloningOriginId,
        youngerCloneId: newSummarySentence.id,
      })
      .execute();

    /* If there are other sentences with the same text as our summary sentence,
    we can set them as as clones. */
    const existingSentences = await Sentence.find({
      where: {
        text: paragraphInput.text,
        id: Not(In([newSummarySentence.id, cloningOriginId])),
      },
      skip: 0,
      take: 100,
    });
    if (existingSentences) {
      await Promise.all(
        existingSentences.map(async (existingSentence) => {
          await getConnection()
            .createQueryBuilder()
            .insert()
            .into(Cloning)
            .values({
              olderCloneId: existingSentence.id,
              youngerCloneId: newSummarySentence.id,
            })
            .execute();
        })
      );
    }

    // Create children sentences and add parent child relations
    await getConnection().transaction(async (manager) => {
      await Promise.all(
        paragraphInput.childrenText.map(async (childText, index) => {
          let newChild: Sentence;
          const newChildQuery = await manager
            .createQueryBuilder()
            .insert()
            .into(Sentence)
            .values({
              text: childText,
              subjects: paragraphInput.subjects,
              teacherId: req.session.userId,
            })
            .returning("*")
            .execute();
          newChild = newChildQuery.raw[0];

          await manager
            .createQueryBuilder()
            .insert()
            .into(ParentChild)
            .values({
              parentId: newSummarySentence.id,
              childId: newChild!.id,
              orderNumber: index,
            })
            .execute();

          /* If there are existing children with the same text as our child 
            text, we can set them as as clones. */
          const existingChildren = await Sentence.find({
            where: { text: childText, id: Not(newChild.id) },
            skip: 0,
            take: 100,
          });
          if (existingChildren) {
            await Promise.all(
              existingChildren.map(async (existingChild) => {
                await manager
                  .createQueryBuilder()
                  .insert()
                  .into(Cloning)
                  .values({
                    olderCloneId: existingChild.id,
                    youngerCloneId: newChild.id,
                  })
                  .execute();
              })
            );
          }
        })
      );
    });
    return newSummarySentence;
  }

  @Query(() => Sentence, { nullable: true })
  async sentence(@Arg("id", () => Int) id: number) {
    return Sentence.findOne(id);
  }

  @Query(() => PaginatedSentences)
  async sentences(
    @Arg("limit", () => Int, { defaultValue: 10 }) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedSentences> {
    const realLimit = Math.min(100, limit);
    const realLimitPlusOne = realLimit + 1;

    const parameters: any[] = [realLimitPlusOne];
    if (cursor) {
      parameters.push(new Date(cursor));
    }

    const sentences = await getConnection().query(
      `
      select distinct(s.*)
      from sentence s join parent_child pc
      on s.id = pc."parentId"
      ${cursor ? `where s."createdAt" < $2` : ""}
      order by s."createdAt" DESC
      limit $1
    `,
      parameters
    );

    return {
      sentences: sentences.slice(0, realLimit),
      hasMore: sentences.length === realLimitPlusOne,
    };
  }

  @Mutation(() => Sentence, { nullable: true })
  @UseMiddleware(isAuth)
  async updateParagraph(
    @Arg("id", () => Int) id: number,
    @Arg("paragraphInput", () => ParagraphInput) paragraphInput: ParagraphInput,
    @Ctx() { req }: MyContext
  ): Promise<Sentence | null> {
    const summarySentenceUpdate = await getConnection()
      .createQueryBuilder()
      .update(Sentence)
      .set({
        ...(paragraphInput.text && { text: paragraphInput.text }),
        ...(paragraphInput.subjects && { subjects: paragraphInput.subjects }),
      })
      .where("id = :id and teacherId = :teacherId", {
        id,
        teacherId: req.session.userId,
      })
      .returning("*")
      .execute();

    const updatedSummarySentence = summarySentenceUpdate.raw[0];

    // Add new clones where the updated text matches
    const existingOlderClonesIds = (
      await Cloning.find({
        where: { youngerCloneId: id },
        skip: 0,
        take: 100,
      })
    ).map((existingClone) => existingClone.olderCloneId);

    const existingYoungerClonesIds = (
      await Cloning.find({
        where: { olderCloneId: id },
        skip: 0,
        take: 100,
      })
    ).map((existingClone) => existingClone.youngerCloneId);

    const existingClones = existingOlderClonesIds
      .concat(existingYoungerClonesIds)
      .concat([id]);

    const existingSentences = await Sentence.find({
      where: {
        text: paragraphInput.text,
        id: Not(In(existingClones)),
      },
      skip: 0,
      take: 100,
    });

    if (existingSentences) {
      await Promise.all(
        existingSentences.map(async (existingSentence) => {
          await getConnection()
            .createQueryBuilder()
            .insert()
            .into(Cloning)
            .values({
              olderCloneId: existingSentence.id,
              youngerCloneId: updatedSummarySentence.id,
            })
            .execute();
        })
      );
    }

    if (paragraphInput.childrenText) {
      // Get the number of children
      const childrenCount = await ParentChild.count({
        where: { parentId: id },
      });

      if (childrenCount !== paragraphInput.childrenText.length) {
        throw new Error(
          "Cannot update with a different number of children than expected."
        );
      }
      await getConnection().transaction(async (manager) => {
        await Promise.all(
          paragraphInput.childrenText.map(async (childText, index) => {
            // For each new child, find original child ID with order number
            const relationship = await ParentChild.findOne({
              where: { parentId: id, orderNumber: index },
            });
            const childId = relationship?.childId;

            if (childId) {
              // Update child sentence
              await manager
                .createQueryBuilder()
                .update(Sentence)
                .set({
                  text: childText,
                  ...(paragraphInput.subjects && {
                    subjects: paragraphInput.subjects,
                  }),
                })
                .where("id = :childId and teacherId = :teacherId", {
                  childId,
                  teacherId: req.session.userId,
                })
                .execute();

              // If there exist other sentences with the child's clones,
              // set them as clones.
              const existingOlderClonesIds = (
                await Cloning.find({
                  where: { youngerCloneId: childId },
                  skip: 0,
                  take: 100,
                })
              ).map((existingClone) => existingClone.olderCloneId);

              const existingYoungerClonesIds = (
                await Cloning.find({
                  where: { olderCloneId: childId },
                  skip: 0,
                  take: 100,
                })
              ).map((existingClone) => existingClone.youngerCloneId);

              const existingClones = existingOlderClonesIds
                .concat(existingYoungerClonesIds)
                .concat([childId]);

              const existingSentences = await Sentence.find({
                where: {
                  text: childText,
                  id: Not(In(existingClones)),
                },
                skip: 0,
                take: 100,
              });

              if (existingSentences) {
                await Promise.all(
                  existingSentences.map(async (existingSentence) => {
                    await getConnection()
                      .createQueryBuilder()
                      .insert()
                      .into(Cloning)
                      .values({
                        olderCloneId: existingSentence.id,
                        youngerCloneId: childId,
                      })
                      .execute();
                  })
                );
              }
            }
          })
        );
      });
    }
    return updatedSummarySentence;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteParagraph(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    const sentence = await Sentence.findOne(id);
    if (!sentence) {
      return false;
    }

    const parentRelation = await ParentChild.findOne({
      where: { childId: sentence.id },
    });
    if (parentRelation) {
      return false;
    }

    // Delete children
    const relationships = await ParentChild.find({
      where: { parentId: sentence.id },
      skip: 0,
      take: 100,
    });
    let children = await Promise.all(
      relationships.map(async (relationship) => {
        return await Sentence.findOne(relationship.childId);
      })
    );
    children = children.filter(function (element) {
      return element !== undefined;
    });

    children.forEach(async (child) => {
      // Before deleting children, connect the child's clones
      let olderCloneRelation = await Cloning.findOne({
        where: { youngerCloneId: child!.id },
      });
      let youngerCloneRelation = await Cloning.findOne({
        where: { olderCloneId: child!.id },
      });

      if (olderCloneRelation && youngerCloneRelation) {
        let existingConnection = await Cloning.findOne({
          where: {
            olderCloneId: olderCloneRelation.olderCloneId,
            youngerCloneId: youngerCloneRelation.youngerCloneId,
          },
        });
        if (!existingConnection) {
          await getConnection()
            .createQueryBuilder()
            .insert()
            .into(Cloning)
            .values({
              olderCloneId: olderCloneRelation.olderCloneId,
              youngerCloneId: youngerCloneRelation.youngerCloneId,
            })
            .execute();
        }
      }
      // Delete child
      await Sentence.delete({ id: child!.id, teacherId: req.session.userId });
    });

    // Before deleting parent, connect the parent's clones
    let olderCloneRelation = await Cloning.findOne({
      where: { youngerCloneId: id },
    });
    let youngerCloneRelation = await Cloning.findOne({
      where: { olderCloneId: id },
    });

    if (olderCloneRelation && youngerCloneRelation) {
      let existingConnection = await Cloning.findOne({
        where: {
          olderCloneId: olderCloneRelation.olderCloneId,
          youngerCloneId: youngerCloneRelation.youngerCloneId,
        },
      });
      if (!existingConnection) {
        await getConnection()
          .createQueryBuilder()
          .insert()
          .into(Cloning)
          .values({
            olderCloneId: olderCloneRelation.olderCloneId,
            youngerCloneId: youngerCloneRelation.youngerCloneId,
          })
          .execute();
      }
    }

    // Delete parent
    await Sentence.delete({ id, teacherId: req.session.userId });
    return true;
  }

  @Mutation(() => Sentence)
  @UseMiddleware(isAuth)
  async addVoteToSentence(
    @Arg("sentenceId", () => Int) sentenceId: number,
    @Arg("voteType", () => VoteType) voteType: VoteType,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;
    const existingVote = await SentenceVote.findOne({
      where: { sentenceId, userId },
    });

    const changeSentenceVoteCount = async (
      manager: EntityManager,
      sentenceId: number,
      voteType: VoteType,
      increment: Boolean
    ) => {
      const updatedSentence = await manager
        .createQueryBuilder()
        .update(Sentence)
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
        .where("id = :sentenceId", {
          sentenceId,
        })
        .returning("*")
        .execute();

      return updatedSentence.raw[0];
    };

    let updatedSentenceToSend;

    if (!existingVote) {
      await getConnection().transaction(async (manager) => {
        await manager
          .createQueryBuilder()
          .insert()
          .into(SentenceVote)
          .values({
            userId,
            sentenceId,
            voteType: voteType,
          })
          .execute();
        updatedSentenceToSend = changeSentenceVoteCount(
          manager,
          sentenceId,
          voteType,
          true
        );
      });
    } else {
      // Remove Original Vote from SentenceVote database
      await getConnection().transaction(async (manager) => {
        await manager
          .createQueryBuilder()
          .delete()
          .from(SentenceVote)
          .where('"userId" = :userId and sentenceId = :sentenceId', {
            userId,
            sentenceId,
          })
          .execute();

        updatedSentenceToSend = changeSentenceVoteCount(
          manager,
          sentenceId,
          existingVote.voteType,
          false
        );

        // If new vote is different than existing vote, then add new vote
        if (existingVote.voteType != voteType) {
          await manager
            .createQueryBuilder()
            .insert()
            .into(SentenceVote)
            .values({
              userId,
              sentenceId,
              voteType: voteType,
            })
            .execute();

          updatedSentenceToSend = changeSentenceVoteCount(
            manager,
            sentenceId,
            voteType,
            true
          );
        }
      });
    }
    return updatedSentenceToSend;
  }

  @Mutation(() => Sentence, { nullable: true })
  async addViewToSentence(
    @Arg("sentenceId", () => Int) sentenceId: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;
    let viewedSentence: UpdateResult = new UpdateResult();
    if (userId) {
      const view = await SentenceView.findOne({
        where: { sentenceId, userId },
      });
      await getConnection().transaction(async (manager) => {
        if (!view) {
          await manager
            .createQueryBuilder()
            .insert()
            .into(SentenceView)
            .values({
              userId,
              sentenceId,
              userViewCount: 1,
            })
            .execute();
        } else {
          await manager
            .createQueryBuilder()
            .update(SentenceView)
            .set({ userViewCount: () => '"userViewCount" + 1' })
            .where("userId = :userId and sentenceId = :sentenceId", {
              userId,
              sentenceId,
            })
            .execute();
        }
        viewedSentence = await manager
          .createQueryBuilder()
          .update(Sentence)
          .set({ viewCount: () => '"viewCount" + 1' })
          .where("id = :sentenceId", {
            sentenceId,
          })
          .returning("*")
          .execute();
      });
      return viewedSentence.raw[0];
    } else {
      // For non-authenticated users, we can just add to the view count
      viewedSentence = await getConnection()
        .createQueryBuilder()
        .update(Sentence)
        .set({ viewCount: () => '"viewCount" + 1' })
        .where("id = :sentenceId", {
          sentenceId,
        })
        .returning("*")
        .execute();
    }
  }
}
