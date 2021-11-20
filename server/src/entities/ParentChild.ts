import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  BaseEntity,
  PrimaryColumn,
  OneToOne,
  Column,
  ManyToOne,
} from "typeorm";
import { Sentence } from "./Sentence";

@ObjectType()
@Entity()
export class ParentChild extends BaseEntity {
  @ManyToOne(() => Sentence, (sentence) => sentence.asParent, {
    onDelete: "CASCADE",
  })
  parent: Sentence;

  @Field()
  @PrimaryColumn()
  parentId: number;

  @OneToOne(() => Sentence, (sentence) => sentence.asChild, {
    onDelete: "CASCADE",
  })
  child: Sentence;

  @Field()
  @PrimaryColumn()
  childId: number;

  @Field()
  @Column()
  orderNumber: number;
}
