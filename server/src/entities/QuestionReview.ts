import { Field, ObjectType, registerEnumType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { Question } from "./Question";
import { User } from "./User";

export enum ReviewStatus {
  QUEUED = "queued",
  INCORRECT = "incorrect",
  CORRECT = "correct",
}
registerEnumType(ReviewStatus, {
  name: "ReviewStatus",
});

@ObjectType()
@Entity()
export class QuestionReview extends BaseEntity {
  @Field()
  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.questionReviews, {
    onDelete: "CASCADE",
  })
  user: User;

  @Field()
  @PrimaryColumn()
  questionId: number;

  @Field(() => Question)
  @ManyToOne(() => Question, (question) => question.reviews, {
    onDelete: "CASCADE",
  })
  question: Question;

  @Field(() => ReviewStatus)
  @Column({ type: "enum", enum: ReviewStatus })
  reviewStatus: ReviewStatus;  

  @Field()
  @Column()
  correctStreak: number;

  @Field(() => Date)
  @Column({ type: "date" })
  dateNextAvailable: Date;

  @Field(() => Date)
  @CreateDateColumn()
  dateCreated: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  dateUpdated: Date;
}
