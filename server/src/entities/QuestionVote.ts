import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { VoteType } from "../utils/voteTypeEnum";
import { Question } from "./Question";
import { User } from "./User";

@ObjectType()
@Entity()
export class QuestionVote extends BaseEntity {
  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.questionVotes, {
    onDelete: 'CASCADE',
  })
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
