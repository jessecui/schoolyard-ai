import { ObjectType, Field } from "type-graphql";
import { Entity, BaseEntity, PrimaryColumn, OneToMany } from "typeorm";
import { QuestionSubject } from "./QuestionSubject";
import { Score } from "./Score";
import { SentenceSubject } from "./SentenceSubject";

@ObjectType()
@Entity()
export class Subject extends BaseEntity {
  @Field()
  @PrimaryColumn()
  subjectName: string;

  @OneToMany(() => Score, (score) => score.subject)
  scores: Score[];

  @OneToMany(
    () => SentenceSubject,
    (sentenceSubject) => sentenceSubject.subject,
    {
      onDelete: "CASCADE",
    }
  )
  sentenceSubjects: SentenceSubject[];

  @OneToMany(
    () => QuestionSubject,
    (questionSubject) => questionSubject.subject,
    {
      onDelete: "CASCADE",
    }
  )
  questionSubjects: QuestionSubject[];
}
