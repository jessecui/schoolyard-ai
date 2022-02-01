import { ObjectType, Field } from "type-graphql";
import { Entity, BaseEntity, PrimaryColumn, Column } from "typeorm";

@ObjectType()
@Entity()
export class Word extends BaseEntity {
  @Field()
  @PrimaryColumn()
  word: string;
  
  @Field(() => [Number])
  @Column("float", { array: true} )
  embedding: number[];
}
