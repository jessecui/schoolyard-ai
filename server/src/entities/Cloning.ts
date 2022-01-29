import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { Sentence } from "./Sentence";

@ObjectType()
@Entity()
export class Cloning extends BaseEntity {
  @ManyToOne(() => Sentence, (sentence) => sentence.asOlderClone, {
    onDelete: "CASCADE",
  })
  olderClone: Sentence;

  @Field()
  @PrimaryColumn()
  olderCloneId: number;

  @ManyToOne(() => Sentence, (sentence) => sentence.asYoungerClone, {
    onDelete: "CASCADE",
  })
  youngerClone: Sentence;

  @Field()
  @PrimaryColumn()
  youngerCloneId: number;

  @Field()
  @Column('float', {default: -1})
  distance: number
}
