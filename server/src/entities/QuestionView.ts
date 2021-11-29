import { ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn
} from "typeorm";
import { Question } from "./Question";
import { User } from "./User";

@ObjectType()
@Entity()
export class QuestionView extends BaseEntity {  
  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.questionViews, {
    onDelete: 'CASCADE',
  })
  user: User;

  @PrimaryColumn()
  questionId: number;

  @ManyToOne(() => Question, (question) => question.votes, {
    onDelete: 'CASCADE',
  })
  question: Question;

  @Column()
  userViewCount: number;
}
