import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { Question } from "./Question";
import { Subject } from "./Subject";

@ObjectType()
@Entity()
export class QuestionSubject extends BaseEntity {
  @Field()
  @PrimaryColumn()
  questionId: number;

  @ManyToOne(() => Question, (question) => question.questionSubjects, {
    onDelete: "CASCADE",
  })
  question: Question;

  @Field()
  @PrimaryColumn()
  subjectName: string;

  @ManyToOne(() => Subject, (subject) => subject.questionSubjects, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "subjectName" })
  subject: Subject;

  @Field()
  @Column()
  order: number;
}
