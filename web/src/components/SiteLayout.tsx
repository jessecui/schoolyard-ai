import { StarIcon } from "@chakra-ui/icons";
import { Container, Grid, GridItem } from "@chakra-ui/layout";
import {
  Box,
  Button,
  Circle,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from "react";
import { GoChecklist } from "react-icons/go";
import {
  MeDocument,
  MeQuery,
  Question,
  QuestionReview,
  ReviewStatus,
  useCreateQuestionReviewMutation,
  useMeQuery,
} from "../generated/graphql";
import { Navbar } from "./Navbar";

export const SiteLayout: React.FC<{}> = ({ children }) => {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useMeQuery();
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);

  const [createQuestionReview] = useCreateQuestionReviewMutation();

  useEffect(() => {
    if (router.pathname !== "/learn/[id]") {
      setAvailableQuestions([]);
    }
  }, [router]);

  let sortedQuestionReviews: QuestionReview[] = [];
  let availableQuestionsNotSaved: Question[] = [];

  if (meData?.me) {
    sortedQuestionReviews = Object.assign(
      [],
      meData.me.questionReviews
    ) as QuestionReview[];
    console.log(sortedQuestionReviews);
    sortedQuestionReviews.sort(
      (a, b) =>
        new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );
    console.log(sortedQuestionReviews);

    const savedQuestionIds = meData.me.questionReviews.map(
      (review) => review.questionId
    );
    availableQuestionsNotSaved = savedQuestionIds
      ? availableQuestions.filter(
          (question) =>
            savedQuestionIds && !savedQuestionIds.includes(question.id)
        )
      : [];
  }

  return (
    <>
      <Navbar />
      <Container maxW="container.xl" pt={4}>
        <Grid templateColumns="repeat(10, 1fr)" gap={4}>
          <GridItem colSpan={3}>
            {meData?.me?.id && (
              <Stack spacing={2}>
                {availableQuestionsNotSaved.length > 0 && (
                  <Box
                    border="2px"
                    borderColor="grayLight"
                    borderRadius="md"
                    bg="White"
                    p={4}
                  >
                    <Text fontWeight="bold" color="grayMain" fontSize="md">
                      Available Questions
                    </Text>
                    <Stack py={2} spacing={4}>
                      {availableQuestionsNotSaved.map((question) => (
                        <Box key={question.id}>
                          <Box>
                            <HStack spacing="6px">
                              {question.subjects.map((subject) => (
                                <Flex align="center" key={subject}>
                                  <Circle mr="4px" size={4} bg="grayMain" />
                                  <Text fontSize="xs">{"#" + subject}</Text>
                                </Flex>
                              ))}
                            </HStack>
                          </Box>
                          <Text fontWeight="bold" fontSize="lg">
                            {question.question}
                          </Text>
                          <Button
                            mt={1}
                            bg="mint"
                            color="white"
                            size="xs"
                            onClick={() =>
                              createQuestionReview({
                                variables: {
                                  questionId: question.id,
                                  reviewStatus: ReviewStatus.Queued,
                                },
                                update: (cache, { data: responseData }) => {
                                  if (
                                    meData.me &&
                                    responseData?.createQuestionReview
                                  ) {
                                    let updatedMeData = Object.assign(
                                      {},
                                      meData.me
                                    );
                                    updatedMeData.questionReviews = [
                                      ...updatedMeData.questionReviews,
                                      responseData.createQuestionReview,
                                    ];
                                    cache.writeQuery<MeQuery>({
                                      query: MeDocument,
                                      data: {
                                        __typename: "Query",
                                        me: updatedMeData,
                                      },
                                    });
                                  }
                                },
                              })
                            }
                          >
                            <StarIcon mr={2} />
                            <Text as="span" fontSize="xs">
                              save
                            </Text>
                          </Button>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
                <Box
                  border="2px"
                  borderColor="grayLight"
                  borderRadius="md"
                  bg="White"
                  p={4}
                >
                  <Text fontWeight="bold" color="grayMain" fontSize="md">
                    Recently Saved Questions
                  </Text>
                  <Stack py={2} spacing={4}>
                    {sortedQuestionReviews.map((questionReview) => (
                      <Box key={questionReview.questionId}>
                        <Box>
                          <HStack spacing="6px">
                            {questionReview.question.subjects.map((subject) => (
                              <Flex align="center" key={subject}>
                                <Circle mr="4px" size={4} bg="grayMain" />
                                <Text fontSize="xs">{"#" + subject}</Text>
                              </Flex>
                            ))}
                          </HStack>
                        </Box>
                        <Text fontWeight="bold" fontSize="lg">
                          {questionReview.question.question}
                        </Text>
                        <Button mt={1} bg="iris" color="white" size="xs">
                          <Icon as={GoChecklist} />
                          <Text ml={2} as="span" fontSize="xs">
                            answer
                          </Text>
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            )}
          </GridItem>
          <GridItem colSpan={4}>
            <Container maxW="container.sm">
              {isValidElement(children) &&
                cloneElement(children, { setAvailableQuestions })}
            </Container>
          </GridItem>
          <GridItem colSpan={3}>
            {meData?.me?.id && (
              <Box
                border="2px"
                borderColor="grayLight"
                borderRadius="md"
                bg="White"
                p={4}
              >
                <Text fontWeight="bold" color="grayMain" fontSize="md">
                  Performance Scorecard
                </Text>
              </Box>
            )}
          </GridItem>
        </Grid>
      </Container>
    </>
  );
};
