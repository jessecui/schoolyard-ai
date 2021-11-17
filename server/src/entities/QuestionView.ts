import { ObjectType } from "type-graphql";
import {
  BaseEntity,
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

  @ManyToOne(() => User, (user) => user.questionViews)
  user: User;

  @PrimaryColumn()
  questionId: number;

  @ManyToOne(() => Question, (question) => question.votes, {
    onDelete: 'CASCADE',
  })
  question: Question;
}
