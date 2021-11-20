import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Entity, ManyToMany, PrimaryColumn } from "typeorm";
import { Sentence } from "./Sentence";

@ObjectType()
@Entity()
export class Cloning extends BaseEntity {
  @ManyToMany(() => Sentence, (sentence) => sentence.olderCloneRelation, {
    onDelete: "CASCADE",
  })
  olderClone: Sentence;

  @Field()
  @PrimaryColumn()
  olderCloneId: number;

  @ManyToMany(() => Sentence, (sentence) => sentence.youngerCloneRelation, {
    onDelete: "CASCADE",
  })
  youngerClone: Sentence;

  @Field()
  @PrimaryColumn()
  youngerCloneId: number;
}
