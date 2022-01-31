import { Field, ObjectType, registerEnumType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { QuestionVote } from "./QuestionVote";
import { QuestionView } from "./QuestionView";
import { Sentence } from "./Sentence";
import { User } from "./User";
import { QuestionReview } from "./QuestionReview";
import { QuestionSubject } from "./QuestionSubject";
import { VoteType } from "../types";

export enum QuestionType {
  TEXT = "text", // Written answer
  SINGLE = "single", // Multiple choice single answer
  MULTIPLE = "multiple", // Multiple choice multiple answer
}
registerEnumType(QuestionType, {
  name: "QuestionType",
});

@ObjectType()
@Entity()
export class Question extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  creatorId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.createdQuestions, {
    onDelete: "CASCADE",
  })
  creator: User;

  @Field(() => [String])
  subjects: string[];

  @OneToMany(
    () => QuestionSubject,
    (questionSubject) => questionSubject.question
  )
  questionSubjects: QuestionSubject[];

  @Field()
  @Column()
  text: string;

  @Field(() => QuestionType)
  @Column({
    type: "enum",
    enum: QuestionType,
  })
  questionType: QuestionType;

  @Field({nullable: true})
  @Column({nullable: true})
  sentenceId: number;

  @Field(() => Sentence, {nullable: true})
  @ManyToOne(() => Sentence, (sentence) => sentence.questions, {
    onDelete: "SET NULL",
  })
  sentence: Sentence[];

  @Field(() => [String], { nullable: true })
  @Column("varchar", { array: true, nullable: true })
  choices: string[];

  @Field(() => [String])
  @Column("varchar", { array: true })
  answer: string[];

  @OneToMany(() => QuestionVote, (vote) => vote.question)
  votes: QuestionVote[];

  @Field()
  @Column({ default: 0 })
  upVoteCount: number;

  @Field()
  @Column({ default: 0 })
  downVoteCount: number;

  @Field(() => VoteType, { nullable: true })
  userVoteType: VoteType | null;

  @OneToMany(() => QuestionView, (view) => view.question)
  views: QuestionView[];

  @Field()
  @Column({ default: 0 })
  viewCount: number;

  @OneToMany(() => QuestionReview, (review) => review.question)
  reviews: QuestionReview[];

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
