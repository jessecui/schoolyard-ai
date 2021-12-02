import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  BaseEntity,
  PrimaryColumn,
  ManyToOne,
  Column,
  JoinColumn,
} from "typeorm";
import { Subject } from "./Subject";
import { User } from "./User";

@ObjectType()
@Entity()
export class Score extends BaseEntity {
  @Field()
  @PrimaryColumn()
  subjectName: string;

  @ManyToOne(() => Subject, (subject) => subject.scores, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "subjectName" })
  subject: Subject;

  @Field()
  @PrimaryColumn()
  userId: Number;

  @ManyToOne(() => User, (user) => user.scores, {
    onDelete: "CASCADE",
  })
  user: Subject;

  @Field()
  @Column()
  queued: number;

  @Field()
  @Column()
  correct: number;

  @Field()
  @Column()
  incorrect: number;
}
