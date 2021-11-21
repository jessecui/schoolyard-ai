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
import { QuestionVote, VoteType } from "./QuestionVote";
import { QuestionView } from "./QuestionView";
import { Sentence } from "./Sentence";
import { User } from "./User";

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
  teacherId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.questions)
  teacher: User;

  @Field(() => [String])
  @Column("varchar", { array: true })
  subjects: string[];

  @Field()
  @Column()
  question: string;

  @Field(() => QuestionType)
  @Column({
    type: "enum",
    enum: QuestionType,
  })
  questionType: QuestionType;

  @Field()
  @Column()
  sentenceId: number;

  @Field(() => Sentence)
  @ManyToOne(() => Sentence, (sentence) => sentence.questions, {
    onDelete: "CASCADE",
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

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
