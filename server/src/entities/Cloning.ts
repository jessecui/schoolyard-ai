import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Entity, ManyToMany, PrimaryColumn } from "typeorm";
import { Sentence } from "./Sentence";

@ObjectType()
@Entity()
export class Cloning extends BaseEntity {
  @ManyToMany(() => Sentence, (sentence) => sentence.asOlderClone, {
    onDelete: "CASCADE",
  })
  olderClones: Sentence[];

  @Field()
  @PrimaryColumn()
  olderCloneId: number;

  @ManyToMany(() => Sentence, (sentence) => sentence.asYoungerClone, {
    onDelete: "CASCADE",
  })
  youngerClones: Sentence[];

  @Field()
  @PrimaryColumn()
  youngerCloneId: number;
}
