import { Box } from "@chakra-ui/layout";
import { Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";
import { useMeQuery } from "../generated/graphql";
import { withApollo } from "../utils/withApollo";

const Review: React.FC<{}> = ({}) => {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useMeQuery();

  if (meData?.me?.questionReviews && meData.me.questionReviews.length > 0) {    
    router.push("/review/" + meData.me.questionReviews[0].questionId);
  }

  return !meLoading && !meData?.me?.questionReviews ? (
    <Box
      border="2px"
      borderColor="grayLight"
      borderRadius="md"
      bg="White"
      p={4}
    >
      <Text fontSize="md">You don't have any questions for review.</Text>
    </Box>
  ) : null;
};

export default withApollo({ ssr: false })(Review);
