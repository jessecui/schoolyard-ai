import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Question } from "./Question";
import { QuestionReview } from "./QuestionReview";
import { QuestionView } from "./QuestionView";
import { QuestionVote } from "./QuestionVote";
import { Sentence } from "./Sentence";
import { SentenceView } from "./SentenceView";
import { SentenceVote } from "./SentenceVote";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Field()
  @Column()
  firstName!: string;

  @Field()
  @Column()
  lastName!: string;

  @Column()
  password!: string;

  @OneToMany(() => Sentence, (sentence) => sentence.teacher)
  sentences: Sentence[];

  @OneToMany(() => SentenceVote, (vote) => vote.user)
  sentenceVotes: SentenceVote[];

  @OneToMany(() => SentenceView, (view) => view.user)
  sentenceViews: SentenceView[];

  @OneToMany(() => Question, (question) => question.teacher)
  questions: Question[];

  @OneToMany(() => QuestionVote, (vote) => vote.user)
  questionVotes: QuestionVote[];

  @OneToMany(() => QuestionView, (view) => view.user)
  questionViews: QuestionView[];

  @OneToMany(() => QuestionReview, (review) => review.user)
  questionReviews: QuestionReview[];

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
