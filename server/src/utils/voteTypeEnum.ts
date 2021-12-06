import { registerEnumType } from "type-graphql";

export enum VoteType {
  UP = 1,
  DOWN = -1,
}
registerEnumType(VoteType, { name: "VoteType" });
