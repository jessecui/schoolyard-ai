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
import { EntityManager, getConnection, UpdateResult } from "typeorm";
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
  @Field({ nullable: true })
  cloningOriginText: string;
  @Field({ nullable: true })
  cloningOriginId: number;
  @Field({ nullable: true })
  cloningOriginTeacherId: number;
}

@ObjectType()
class PaginatedSentences {
  @Field(() => [Sentence])
  sentences: Sentence[];
  @Field()
  hasMore: boolean;
}

const getRootOrigin = async (sentence: Sentence): Promise<Sentence> => {
  let origin;
  const relationship = await Cloning.findOne({
    where: { cloneId: sentence.id },
  });
  if (relationship) {
    origin = await Sentence.findOne(relationship?.originId);
  }

  return origin ? getRootOrigin(origin) : sentence;
};

const getAllClones = async (sentence: Sentence): Promise<Sentence[]> => {
  const relationships = await Cloning.find({
    where: { originId: sentence.id },
    skip: 0,
    take: 100,
  });
  let rawClones = await Promise.all(
    relationships.map(async (relationship) => {
      return await Sentence.findOne(relationship.cloneId);
    })
  );
  let clones: Sentence[] = rawClones.filter(function (element) {
    return element !== undefined;
  }) as Sentence[];

  let clonesClones = (
    await Promise.all(clones.map(async (clone) => await getAllClones(clone)))
  ).flat();

  return [...clones, ...clonesClones];
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

  @FieldResolver(() => Sentence, { nullable: true })
  async origin(@Root() sentence: Sentence) {
    const relationship = await Cloning.findOne({
      where: { cloneId: sentence.id },
    });
    if (relationship) {
      return await Sentence.findOne(relationship?.originId);
    }
    return null;
  }

  @FieldResolver(() => [Sentence], { nullable: true })
  async clones(@Root() sentence: Sentence) {
    const relationships = await Cloning.find({
      where: { originId: sentence.id },
      skip: 0,
      take: 100,
    });
    let clones = await Promise.all(
      relationships.map(async (relationship) => {
        return await Sentence.findOne(relationship.cloneId);
      })
    );
    clones = clones.filter(function (element) {
      return element !== undefined;
    });
    return clones.length > 0 ? clones : null;
  }

  // Returns the root origin
  @FieldResolver(() => Sentence)
  async rootOrigin(@Root() sentence: Sentence) {
    return getRootOrigin(sentence);
  }

  // Returns a list of sentence and all of its clones with children
  @FieldResolver(() => [Sentence], { nullable: true })
  async allClones(@Root() sentence: Sentence) {
    const rootOrigin = await getRootOrigin(sentence);
    let allClones = [rootOrigin, ...(await getAllClones(rootOrigin))];

    // Sort with proximity of date created to sentence
    allClones.sort(
      (a, b) =>
        Math.abs(a.createdAt.getTime() - sentence.createdAt.getTime()) -
        Math.abs(b.createdAt.getTime() - sentence.createdAt.getTime())
    );

    return allClones;
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
    @Arg("paragraphInput", () => ParagraphInput) paragraphInput: ParagraphInput
  ): Promise<Sentence> {
    // Check to see if sentence already exists for teacher
    // If so, and that sentence has no children, extend off of that child
    let result: Sentence;
    const existingSentence = await Sentence.findOne({
      where: { text: paragraphInput.text, teacherId: req.session.userId },
    });

    if (existingSentence && !existingSentence.children) {
      result = existingSentence;
    } else {
      // If not, create a new sentence
      const rawResult = await getConnection()
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

      result = rawResult.raw[0];
    }

    // Set cloning lineage if one exists
    if (
      paragraphInput.cloningOriginId &&
      (paragraphInput.cloningOriginText != paragraphInput.text ||
        paragraphInput.cloningOriginTeacherId != req.session.userId)
    ) {
      await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Cloning)
        .values({
          originId: paragraphInput.cloningOriginId,
          cloneId: result.id,
        })
        .returning("*")
        .execute();
    }

    // Add parent child relation for children sentences
    await getConnection().transaction(async (manager) => {
      const childrenInserts = paragraphInput.childrenText.map(
        async (childText, index) => {
          const rawChildResult = await manager
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

          const childResult = rawChildResult.raw[0];

          await manager
            .createQueryBuilder()
            .insert()
            .into(ParentChild)
            .values({
              parentId: result.id,
              childId: childResult.id,
              orderNumber: index,
            })
            .returning("*")
            .execute();
        }
      );
      await Promise.all(childrenInserts);
    });
    return result;
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
    // Update main sentence
    let result: Sentence;

    // Check to see if sentence already exists for teacher
    const existingSentence = await Sentence.findOne({
      where: { text: paragraphInput.text, teacherId: req.session.userId },
    });

    // If so, set that as a new sentence and delete the old one
    if (
      existingSentence &&
      existingSentence.id != id &&
      !existingSentence.children
    ) {
      result = existingSentence;
      await getConnection()
        .createQueryBuilder()
        .update(ParentChild)
        .set({
          childId: existingSentence.id,
        })
        .where("childId = :childId", { childId: existingSentence.id });
      await getConnection()
        .createQueryBuilder()
        .update(ParentChild)
        .set({
          parentId: existingSentence.id,
        })
        .where("parentId = :parentId", { parentId: existingSentence.id });
      await Sentence.delete({ id });
    } else {
      // Otherwise update the sentence text
      const rawResult = await getConnection()
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

      result = rawResult.raw[0];
    }

    // Update cloning lineage if necessary
    // Check if Origin ID is different
    // If different, delete update clone object
    if (
      paragraphInput.cloningOriginId &&
      (paragraphInput.cloningOriginText != paragraphInput.text ||
        paragraphInput.cloningOriginTeacherId != req.session.userId)
    ) {
      await getConnection()
        .createQueryBuilder()
        .update(Cloning)
        .set({
          originId: paragraphInput.cloningOriginId,
        })
        .where("cloneId = :cloneId", {
          cloneId: result.id,
          teacherId: req.session.userId,
        })
        .returning("*")
        .execute();
    }

    if (paragraphInput.childrenText) {
      // Get the number of children
      const childrenCount = await ParentChild.count({
        where: { parentId: id },
      });
      await getConnection().transaction(async (manager) => {
        const childrenUpdates = paragraphInput.childrenText.map(
          async (childText, index) => {
            if (index < childrenCount) {
              // For each new child, find original child ID with order number
              const relationship = await ParentChild.findOne({
                where: { parentId: id, orderNumber: index },
              });
              const childId = relationship?.childId;

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
            } else {
              // Add new children if there are more children than before
              const rawChildResult = await manager
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

              const childResult = rawChildResult.raw[0];

              await manager
                .createQueryBuilder()
                .insert()
                .into(ParentChild)
                .values({
                  parentId: id,
                  childId: childResult.id,
                  orderNumber: index,
                })
                .returning("*")
                .execute();
            }
          }
        );
        // Remove the old children if there are less children than before
        for (
          let i = paragraphInput.childrenText.length;
          i < childrenCount;
          i++
        ) {
          const relationship = await ParentChild.findOne({
            where: { parentId: id, orderNumber: i },
          });
          const childId = relationship?.childId;
          await Sentence.delete({ id: childId, teacherId: req.session.userId });
          await ParentChild.delete({ parentId: id, childId, orderNumber: i });
        }
        await Promise.all(childrenUpdates);
      });
    }
    return result;
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
      await Sentence.delete({ id: child?.id, teacherId: req.session.userId });
    });

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
