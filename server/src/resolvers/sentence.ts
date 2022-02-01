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
import { CloneType, Cloning } from "../entities/Cloning";
import { ParentChild } from "../entities/ParentChild";
import { Question } from "../entities/Question";
import { QuestionSubject } from "../entities/QuestionSubject";
import { Sentence } from "../entities/Sentence";
import { SentenceSubject } from "../entities/SentenceSubject";
import { SentenceView } from "../entities/SentenceView";
import { SentenceVote } from "../entities/SentenceVote";
import { Subject } from "../entities/Subject";
import { User } from "../entities/User";
import { MyContext, VoteType } from "../types";
import { isAuth } from "../utils/isAuth";
import {
  getSentenceEmbedding,
  insertDistances,
} from "../utils/textAnalysis";

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

const insertSentenceSubjects = async (
  subjects: string[],
  sentenceId: number,
  existingManager: EntityManager | null,
  update: boolean
) => {
  if (update) {
    await SentenceSubject.delete({ sentenceId });
  }
  await getConnection().transaction(async (manager) => {
    if (existingManager) {
      manager = existingManager;
    }
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
          .into(SentenceSubject)
          .values({ sentenceId, subjectName, order: index })
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
      order: {
        orderNumber: "ASC",
      },
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

  @FieldResolver(() => [String])
  async subjects(@Root() sentence: Sentence) {
    const subjects = await SentenceSubject.find({
      where: { sentenceId: sentence.id },
      order: {
        order: "ASC",
      },
    });
    return subjects.map((subject) => subject.subjectName);
  }

  // Returns a list of the sentence and all of its clones
  @FieldResolver(() => [Sentence], { nullable: true })
  async clones(@Root() sentence: Sentence) {
    const youngerCloneRelations = await createQueryBuilder(Cloning)
      .where('"olderCloneId" = :olderCloneId and distance < :threshold', {
        olderCloneId: sentence.id,
        threshold: 0.17,
      })
      .getMany();

    const olderCloneRelations = await createQueryBuilder(Cloning)
      .where('"youngerCloneId" = :youngerCloneId AND distance < :threshold', {
        youngerCloneId: sentence.id,
        threshold: 0.17,
      })
      .getMany();

    const allCloneRelations = youngerCloneRelations
      .concat(olderCloneRelations)
      .sort((a, b) => {
        const diff = a.distance - b.distance;
        if (diff != 0) {
          return diff;
        } else {
          if (a.cloneType == CloneType.AUTO && b.cloneType != CloneType.AUTO) {
            return 1;
          } else if (
            a.cloneType != CloneType.AUTO &&
            b.cloneType == CloneType.AUTO
          ) {
            return -1;
          } else {
            return 0;
          }
        }
      });

    const clones = (await Promise.all(
      allCloneRelations.map(async (relationship) => {
        if (relationship.olderCloneId != sentence.id) {
          return await Sentence.findOne(relationship.olderCloneId);
        } else {
          return await Sentence.findOne(relationship.youngerCloneId);
        }
      })
    )) as Sentence[];

    return [sentence].concat(clones);
  }

  @FieldResolver(() => User)
  async creator(@Root() sentence: Sentence) {
    const creator = await User.findOne(sentence.creatorId);
    return creator;
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

  @FieldResolver(() => [Question])
  async questions(@Root() sentence: Sentence) {
    return await Question.find({
      where: {
        sentenceId: sentence.id,
      },
    });
  }

  @Mutation(() => Sentence)
  @UseMiddleware(isAuth)
  async createParagraph(
    @Ctx() { req }: MyContext,
    @Arg("paragraphInput", () => ParagraphInput) paragraphInput: ParagraphInput,
    @Arg("cloningOriginId", () => Int, { nullable: true })
    cloningOriginId: number
  ): Promise<Sentence> {
    const embedding = await getSentenceEmbedding(paragraphInput.text);
    const summarySentenceQuery = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Sentence)
      .values({
        text: paragraphInput.text,
        creatorId: req.session.userId,
        embedding,
      })
      .returning("*")
      .execute();

    const newSummarySentence = summarySentenceQuery.raw[0] as Sentence;

    await insertSentenceSubjects(
      paragraphInput.subjects,
      newSummarySentence.id,
      null,
      false
    );

    if (cloningOriginId) {
      await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Cloning)
        .values({
          olderCloneId: cloningOriginId,
          youngerCloneId: newSummarySentence.id,
          distance: 0,
          cloneType: CloneType.CREATION,
        })
        .execute();
    }

    // Create children sentences and add parent child relations
    const childrenIds: number[] = [];
    await getConnection().transaction(async (manager) => {
      await Promise.all(
        paragraphInput.childrenText.map(async (childText, index) => {
          let newChild: Sentence;
          const childEmbedding = await getSentenceEmbedding(childText);
          const newChildQuery = await manager
            .createQueryBuilder()
            .insert()
            .into(Sentence)
            .values({
              text: childText,
              creatorId: req.session.userId,
              embedding: childEmbedding,
            })
            .returning("*")
            .execute();
          newChild = newChildQuery.raw[0] as Sentence;

          await insertSentenceSubjects(
            paragraphInput.subjects,
            newChild.id,
            manager,
            false
          );

          await manager
            .createQueryBuilder()
            .insert()
            .into(ParentChild)
            .values({
              parentId: newSummarySentence.id,
              childId: newChild.id,
              orderNumber: index,
            })
            .execute();
          childrenIds.push(newChild.id);
        })
      );
    });
    await insertDistances(newSummarySentence.id);
    await Promise.all(
      childrenIds.map(async (childId) => {
        await insertDistances(childId);
      })
    );
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
    const embedding = await getSentenceEmbedding(paragraphInput.text);
    const summarySentenceUpdate = await getConnection()
      .createQueryBuilder()
      .update(Sentence)
      .set({
        ...(paragraphInput.text && {
          text: paragraphInput.text,
          embedding,
        }),
      })
      .where("id = :id and creatorId = :creatorId", {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    const updatedSummarySentence = summarySentenceUpdate.raw[0] as Sentence;

    if (paragraphInput.subjects) {
      insertSentenceSubjects(
        paragraphInput.subjects,
        updatedSummarySentence.id,
        null,
        true
      );
    }

    const updatedChildrenIds: number[] = [];
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
              const childEmbedding = await getSentenceEmbedding(childText);
              const updatedChild = await manager
                .createQueryBuilder()
                .update(Sentence)
                .set({
                  text: childText,
                  embedding: childEmbedding,
                })
                .where("id = :childId and creatorId = :creatorId", {
                  childId,
                  creatorId: req.session.userId,
                })
                .returning("*")
                .execute();

              const updatedChildSentence = updatedChild.raw[0] as Sentence;

              if (paragraphInput.subjects) {
                await insertSentenceSubjects(
                  paragraphInput.subjects,
                  updatedChildSentence.id,
                  manager,
                  true
                );
              }
              updatedChildrenIds.push(childId);
            }
          })
        );
      });
    }
    await insertDistances(updatedSummarySentence.id);
    await Promise.all(
      updatedChildrenIds.map(async (childId) => {
        await insertDistances(childId);
      })
    );
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
    });
    let children = await Promise.all(
      relationships.map(async (relationship) => {
        return await Sentence.findOne(relationship.childId);
      })
    );
    children = children.filter(function (element) {
      return element !== undefined;
    });

    let subjectsToCheck: Set<string> = new Set();

    children.forEach(async (child) => {
      // Retrieve the child's subjects
      (
        await SentenceSubject.find({
          where: { sentenceId: child!.id },
        })
      )
        .map((sentenceSubject) => sentenceSubject.subjectName)
        .forEach((subject) => subjectsToCheck.add(subject));

      // Delete child
      await Sentence.delete({ id: child!.id, creatorId: req.session.userId });
    });

    // Retrieve subjects
    (
      await SentenceSubject.find({
        where: { sentenceId: id },
      })
    )
      .map((sentenceSubject) => sentenceSubject.subjectName)
      .forEach((subject) => subjectsToCheck.add(subject));

    // Delete parent
    await Sentence.delete({ id, creatorId: req.session.userId });

    // Delete subjects if necessary
    await checkSubjectsAndDelete(Array.from(subjectsToCheck));

    return true;
  }

  @Mutation(() => Sentence)
  @UseMiddleware(isAuth)
  async addSentenceVote(
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
  async addSentenceView(
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
