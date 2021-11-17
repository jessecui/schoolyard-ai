import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { Sentence } from "./Sentence";

@ObjectType()
@Entity()
export class Cloning extends BaseEntity {
  @OneToOne(() => Sentence, (sentence) => sentence.originRelation, {
    onDelete: "CASCADE",
  })
  origin: Sentence;

  @Field()
  @PrimaryColumn()
  originId: number;

  @ManyToOne(() => Sentence, (sentence) => sentence.cloneRelation, {
    onDelete: "CASCADE",
  })
  clone: Sentence;

  @Field()
  @PrimaryColumn()
  cloneId: number;

  @Field({ nullable: true })
  @Column({ type: "float", nullable: true })
  cloneQuality: number;
}
