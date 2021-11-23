import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column, Entity,
  ManyToOne,
  PrimaryColumn
} from "typeorm";
import { VoteType } from "./QuestionVote";
import { Sentence } from "./Sentence";
import { User } from "./User";

@ObjectType()
@Entity()
export class SentenceVote extends BaseEntity {  
  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.sentenceVotes, {
    onDelete: 'CASCADE',
  })
  user: User;

  @PrimaryColumn()
  sentenceId: number;

  @ManyToOne(() => Sentence, (sentence) => sentence.votes, {
    onDelete: 'CASCADE',
  })
  sentence: Sentence;

  @Field(() => VoteType)
  @Column({
    type: "enum",
    enum: VoteType,
  })
  voteType: VoteType;
}
