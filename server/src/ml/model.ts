import w2v from "word2vec";

var w2vModel: any;

w2v.loadModel(__dirname + "/word2vec.txt", (error: any, model: any) => {
  if (error) {
    console.log(error);
  } else {
    w2vModel = model;
  }
});

export default function getSentenceEmbedding(sentence: string) {
  const words = sentence.split(/\W+/);
  let sumEmbedding = Array(100).fill(0);
  words.forEach((word) => {
    const embedding = w2vModel.getVector(word);
    if (embedding) {
      sumEmbedding = sumEmbedding.map((num, idx) => {
        return num + embedding.values[idx];
      });
    }
  });

  return sumEmbedding.map((embedding) => embedding / words.length);
}
