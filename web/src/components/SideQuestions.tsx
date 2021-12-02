import { StarIcon } from "@chakra-ui/icons";
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
import router from "next/router";
import React from "react";
import { GoChecklist } from "react-icons/go";
import {
  MeDocument,
  MeQuery,
  Question,
  QuestionReview,
  ReviewStatus,
  useCreateQuestionReviewMutation,
  useMeQuery,
  User,
} from "../generated/graphql";

export const SideQuestions: React.FC<{ availableQuestions: Question[] }> = ({
  availableQuestions,
}) => {
  const { data: meData, loading: meLoading } = useMeQuery();
  const [createQuestionReview] = useCreateQuestionReviewMutation();

  let availableQuestionsNotSaved: Question[] = [];

  if (meData?.me) {
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

  const getTimeDifferenceString = (earlierDate: Date, laterDate: Date) => {
    const secTimeDiff = (laterDate.getTime() - earlierDate.getTime()) / 1000;
    let months = Math.floor(secTimeDiff / (30 * 86400));
    let timeString = "";
    if (months) {
      timeString = months + (months === 1 ? " month" : " months");
    }
    let weeks = Math.floor(secTimeDiff / (7 * 86400));
    if (!months && weeks) {
      timeString = weeks + (weeks === 1 ? " week" : " weeks");
    }
    let days = Math.floor(secTimeDiff / 86400);
    if (!weeks && days) {
      timeString = days + (days === 1 ? " day" : " days");
    }
    let hours = Math.floor(secTimeDiff / 3600);
    if (!days && hours) {
      timeString = hours + (hours === 1 ? " hour" : " hours");
    }
    let minutes = Math.floor(secTimeDiff / 60);
    if (!hours && minutes) {
      timeString = minutes + (minutes === 1 ? " minute" : " minutes");
    }
    if (timeString) {
      return "added " + timeString + " ago";
    }
    return "added just now";
  };

  let subjectToColors: Record<string, string> = {};
  if (meData?.me?.subjectColors) {
    subjectToColors = JSON.parse(meData.me.subjectColors);
  }

  return meData?.me?.id ? (
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
          <Stack spacing={6}>
            {availableQuestionsNotSaved.map((question) => (
              <Box key={question.id} mt={2}>
                <Box>
                  <HStack spacing="6px">
                    {question.subjects.map((subject) => (
                      <Flex align="center" key={subject}>
                        <Circle
                          mr="4px"
                          size={4}
                          bg={
                            subjectToColors[subject]
                              ? subjectToColors[subject]
                              : "grayMain"
                          }
                        />
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
                  onClick={async () =>
                    await createQuestionReview({
                      variables: {
                        questionId: question.id,
                        reviewStatus: ReviewStatus.Queued,
                      },
                      update: (cache, { data: responseData }) => {
                        if (meData.me && responseData?.createQuestionReview) {
                          const cachedMeQuery = cache.readQuery<MeQuery>({
                            query: MeDocument,
                          });

                          const updatedMeData = Object.assign(
                            {},
                            cachedMeQuery?.me
                          ) as User;

                          if (updatedMeData) {
                            updatedMeData.questionReviews = [
                              responseData.createQuestionReview as QuestionReview,
                              ...updatedMeData.questionReviews,
                            ];
                            cache.writeQuery<MeQuery>({
                              query: MeDocument,
                              data: {
                                __typename: "Query",
                                me: updatedMeData,
                              },
                            });
                          }
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
        <Stack spacing={6}>
          {meData.me.questionReviews.slice(0, 5).map((questionReview) => (
            <Box key={questionReview.questionId} mt={2}>
              <Box>
                <HStack spacing="6px">
                  {questionReview.question.subjects.map((subject) => (
                    <Flex align="center" key={subject}>
                      <Circle
                        mr="4px"
                        size={4}
                        bg={
                          subjectToColors[subject]
                            ? subjectToColors[subject]
                            : "grayMain"
                        }
                      />
                      <Text fontSize="xs">{"#" + subject}</Text>
                    </Flex>
                  ))}
                </HStack>
              </Box>
              <Text fontWeight="bold" fontSize="md">
                {questionReview.question.question}
              </Text>
              <HStack mt={1}>
                <Button
                  bg={
                    new Date().getTime() >=
                    new Date(questionReview.dateNextAvailable).getTime()
                      ? "iris"
                      : "grayMain"
                  }
                  color="white"
                  size="xs"
                  onClick={() =>
                    router.push("/review/" + questionReview.questionId)
                  }
                >
                  <Icon as={GoChecklist} />
                  <Text ml={2} as="span" fontSize="xs">
                    answer
                  </Text>
                </Button>
                <Box>
                  <StarIcon fontSize="sm" color="grayMain" mr={2} mb={0.5} />
                  <Text fontSize="sm" color="grayMain" as="span">
                    {getTimeDifferenceString(
                      new Date(questionReview.dateCreated),
                      new Date()
                    )}
                  </Text>
                </Box>
              </HStack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  ) : null;
};
