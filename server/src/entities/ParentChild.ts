import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  BaseEntity,
  PrimaryColumn,
  OneToOne,
  OneToMany,
  Column,
} from "typeorm";
import { Sentence } from "./Sentence";

@ObjectType()
@Entity()
export class ParentChild extends BaseEntity {
  @OneToOne(() => Sentence, (sentence) => sentence.parentRelation, {
    onDelete: "CASCADE",
  })
  parent: Sentence;

  @Field()
  @PrimaryColumn()
  parentId: number;

  @OneToMany(() => Sentence, (sentence) => sentence.childRelation, {
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
