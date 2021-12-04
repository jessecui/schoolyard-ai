import { FieldResolver, Resolver, Root } from "type-graphql";
import { Sentence } from "../entities/Sentence";
import { SentenceView } from "../entities/SentenceView";

@Resolver(SentenceView)
export class SentenceViewResolver {
  @FieldResolver(() => Sentence)
  async sentence(@Root() sentenceView: SentenceView) {    
    return await Sentence.findOne(sentenceView.sentenceId);
  }
}