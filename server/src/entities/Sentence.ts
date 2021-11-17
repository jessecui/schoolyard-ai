import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Cloning } from "./Cloning";
import { ParentChild } from "./ParentChild";
import { Question } from "./Question";
import { VoteType } from "./QuestionVote";
import { SentenceView } from "./SentenceView";
import { SentenceVote } from "./SentenceVote";
import { User } from "./User";

@ObjectType()
@Entity()
export class Sentence extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column()
  teacherId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.sentences)
  teacher: User;

  // Parent Child Lineage
  @OneToOne(() => ParentChild, (parentChild) => parentChild.parent)
  parentRelation: ParentChild;

  @ManyToOne(() => ParentChild, (parentChild) => parentChild.child)
  childRelation: ParentChild;

  @Field(() => Sentence, { nullable: true })
  parent: Sentence;

  @Field(() => [Sentence], {nullable: true})
  children: Sentence[];

  @Field({nullable: true})
  orderNumber: number

  // Clone Lineage
  @OneToOne(() => Cloning, (cloning) => cloning.origin)
  originRelation: Cloning;

  @ManyToOne(() => Cloning, (cloning) => cloning.clone)
  cloneRelation: Cloning;

  @Field(() => Sentence, { nullable: true })
  origin: Sentence;

  @Field(() => [Sentence], {nullable: true})
  clones: Sentence[];

  @Field({nullable: true})
  cloneQuality: number

  @Field(() => Sentence)
  rootOrigin: Sentence;

  @Field(() => [Sentence])
  allClones: Sentence[];

  // Other Metadata
  @Field(() => [String])
  @Column("varchar", { array: true })
  subjects: string[];

  @OneToMany(() => Question, (question) => question.sentence)
  questions: Question[];

  @OneToMany(() => SentenceVote, (vote) => vote.sentence)
  votes: SentenceVote[];

  @Field()
  @Column({ default: 0 })
  upVoteCount: number;

  @Field()
  @Column({ default: 0 })
  downVoteCount: number;

  @Field(() => VoteType, {nullable: true})
  userVoteType: VoteType | null;

  @OneToMany(() => SentenceView, (view) => view.sentence)
  views: SentenceView[];

  @Field()
  @Column({ default: 0 })
  viewCount: number;
  
  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
