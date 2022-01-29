import { Field, ObjectType, registerEnumType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { Sentence } from "./Sentence";

export enum CloneType {
  CREATION = "creation",
  AUTO = "auto",
  MANUAL = "manual"
}
registerEnumType(CloneType, { name: "CloneType" });

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
  @Column('float')
  distance: number

  @Field(() => CloneType)
  @Column({
    type: "enum",
    enum: CloneType,
  })
  cloneType: CloneType
}
