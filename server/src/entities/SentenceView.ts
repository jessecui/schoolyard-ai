import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn
} from "typeorm";
import { Sentence } from "./Sentence";
import { User } from "./User";

@ObjectType()
@Entity()
export class SentenceView extends BaseEntity {  
  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.sentenceViews, {
    onDelete: 'CASCADE',
  })
  user: User;

  @PrimaryColumn()
  sentenceId: number;  

  @Field(() => Sentence)
  @ManyToOne(() => Sentence, (sentence) => sentence.views, {
    onDelete: 'CASCADE',
  })
  sentence: Sentence;

  @Column()
  userViewCount: number;

  @Field(() => Date)
  @UpdateDateColumn({type: "timestamptz"})
  lastViewed: Date;
}
