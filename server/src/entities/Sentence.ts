import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
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
  @ManyToOne(() => User, (user) => user.sentences, {
    onDelete: "CASCADE",
  })
  teacher: User;

  // Parent Child Lineage
  @OneToMany(() => ParentChild, (parentChild) => parentChild.parent)
  asParent: ParentChild[];

  @OneToOne(() => ParentChild, (parentChild) => parentChild.child)
  asChild: ParentChild;

  @Field(() => Sentence, { nullable: true })
  parent: Sentence;

  @Field(() => [Sentence], {nullable: true})
  children: Sentence[];

  @Field({nullable: true})
  orderNumber: number

  // Clone Lineage
  @ManyToMany(() => Cloning, (cloning) => cloning.olderClones)
  asOlderClone: Cloning[];

  @ManyToMany(() => Cloning, (cloning) => cloning.youngerClones)
  asYoungerClone: Cloning[];

  @Field(() => [Sentence], {nullable: true})
  clones: Sentence[];

  @Field({nullable: true})
  cloneQuality: number

  // Other Metadata
  @Field(() => [String])
  @Column("varchar", { array: true })
  subjects: string[];

  @ManyToMany(() => Question, (question) => question.sentence)
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
