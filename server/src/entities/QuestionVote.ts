import { Field, ObjectType, registerEnumType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Question } from "./Question";
import { User } from "./User";

export enum VoteType {
  UP = 1, // Written answer
  DOWN = -1, // Multiple choice single answer
}
registerEnumType(VoteType, {
  name: "VoteType",
});

@ObjectType()
@Entity()
export class QuestionVote extends BaseEntity {
  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.questionVotes)
  user: User;

  @PrimaryColumn()
  questionId: number;

  @ManyToOne(() => Question, (question) => question.votes, {
    onDelete: "CASCADE",
  })
  question: Question;

  @Field(() => VoteType)
  @Column({
    type: "enum",
    enum: VoteType,
  })
  voteType: VoteType;
}
