import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Sentence } from "./Sentence";
import { Subject } from "./Subject";

@ObjectType()
@Entity()
export class SentenceSubject extends BaseEntity {
  @Field()
  @PrimaryColumn()
  sentenceId: number;

  @ManyToOne(() => Sentence, (sentence) => sentence.sentenceSubjects, {
    onDelete: "CASCADE",
  })
  sentence: Sentence;

  @Field()
  @PrimaryColumn()
  subjectName: string;

  @ManyToOne(() => Subject, (subject) => subject.sentenceSubjects)
  subject: Subject;

  @Field()
  @Column()
  order: number;
}
