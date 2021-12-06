import { Box } from "@chakra-ui/layout";
import { SkeletonCircle, SkeletonText, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";
import { QuestionReview, useMeQuery } from "../generated/graphql";
import { withApollo } from "../utils/withApollo";

const Review: React.FC<{}> = ({}) => {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useMeQuery();
  let reviewableQuestions: QuestionReview[] = [];
  if (meData?.me?.questionReviews.length) {
    reviewableQuestions = meData?.me?.questionReviews.filter(
      (review) =>
        new Date().getTime() >= new Date(review.dateNextAvailable).getTime()
    ) as QuestionReview[];
  }
  if (reviewableQuestions.length) {
    router.push("/review/" + reviewableQuestions[0].questionId);
    return (
      <Stack>
        <SkeletonCircle size="10" />
        <SkeletonText mt="4" noOfLines={5} spacing="4" />
      </Stack>
    );
  }
  return (
    <Box
      border="2px"
      borderColor="grayLight"
      borderRadius="md"
      bg="White"
      p={4}
    >
      <Text fontSize="md">You don't have any questions for review.</Text>
    </Box>
  );
};

export default withApollo({ ssr: false })(Review);
