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
import { Score } from "./Score";
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

  @Field(() => [Sentence])
  @OneToMany(() => Sentence, (sentence) => sentence.creator)
  createdParagraphs: Sentence[];

  @OneToMany(() => SentenceVote, (vote) => vote.user)
  sentenceVotes: SentenceVote[];

  @Field(() => [SentenceView])
  @OneToMany(() => SentenceView, (view) => view.user)
  sentenceViews: SentenceView[];

  @Field(() => [Question])
  @OneToMany(() => Question, (question) => question.creator)
  createdQuestions: Question[];

  @OneToMany(() => QuestionVote, (vote) => vote.user)
  questionVotes: QuestionVote[];

  @OneToMany(() => QuestionView, (view) => view.user)
  questionViews: QuestionView[];

  @Field(() => [QuestionReview])
  @OneToMany(() => QuestionReview, (review) => review.user)
  questionReviews: QuestionReview[];

  @Field(() => [Score])
  @OneToMany(() => Score, (score) => score.user)
  scores: Score[];

  @Field()
  subjectColors: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  photoUrl: string;

  @Field()
  @Column({ default: false })
  canCreate: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
