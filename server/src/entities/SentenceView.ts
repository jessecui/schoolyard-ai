import { ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn
} from "typeorm";
import { Sentence } from "./Sentence";
import { User } from "./User";

@ObjectType()
@Entity()
export class SentenceView extends BaseEntity {  
  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.sentenceViews)
  user: User;

  @PrimaryColumn()
  sentenceId: number;  

  @ManyToOne(() => Sentence, (sentence) => sentence.votes, {
    onDelete: 'CASCADE',
  })
  sentence: Sentence;

  @Column()
  userViewCount: number;
}
