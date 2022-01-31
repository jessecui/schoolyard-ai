import { StarIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Center,
  Circle,
  Flex, Icon,
  Link,
  Stack,
  Text
} from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { GoChecklist } from "react-icons/go";
import {
  MeDocument,
  MeQuery,
  Question,
  QuestionReview,
  ReviewStatus,
  Score,
  useCreateQuestionReviewMutation,
  useMeQuery,
  User
} from "../../graphql/generated/graphql";
import { ChangedSubject } from "./SiteLayout";

export const SideQuestions: React.FC<{
  availableQuestions: Question[];
  setActiveScoreSubjects: React.Dispatch<React.SetStateAction<string[]>>;
  setChangedSubjects: React.Dispatch<React.SetStateAction<ChangedSubject[]>>;
}> = ({ availableQuestions, setActiveScoreSubjects, setChangedSubjects }) => {
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
          <Stack spacing={4}>
            {availableQuestionsNotSaved.map((question) => (
              <Box key={question.id} mt={2}>
                <Box>
                  <Flex>
                    {question.subjects.map((subject) => (
                      <Flex align="center" key={subject} mr={2}>
                        <Circle
                          mr="4px"
                          size="12px"
                          bg={
                            subjectToColors[subject]
                              ? subjectToColors[subject]
                              : "grayMain"
                          }
                        />
                        <Text fontSize="xs">{"#" + subject}</Text>
                      </Flex>
                    ))}
                  </Flex>
                </Box>
                <Text fontWeight="bold" fontSize="lg">
                  {question.text}
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
                          setActiveScoreSubjects([]);
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

                            const updatedScores = Object.assign(
                              [],
                              updatedMeData.scores
                            ) as Score[];

                            const newScores: Score[] = [];

                            setChangedSubjects(
                              responseData.createQuestionReview.question.subjects.map(
                                (subject) => {
                                  return {
                                    subject: subject,
                                    oldStatus: ReviewStatus.Queued,
                                    newStatus: ReviewStatus.Queued,
                                  };
                                }
                              )
                            );

                            responseData.createQuestionReview.question.subjects.forEach(
                              (subject) => {
                                const scoreIndex =
                                  updatedMeData.scores.findIndex(
                                    (score) => score.subjectName == subject
                                  );
                                if (scoreIndex >= 0) {
                                  const updatedScore = Object.assign(
                                    {},
                                    updatedScores[scoreIndex]
                                  );
                                  updatedScore.queued = updatedScore.queued + 1;
                                  updatedScores[scoreIndex] = updatedScore;
                                } else {
                                  newScores.push({
                                    __typename: "Score",
                                    subjectName: subject,
                                    queued: 1,
                                    incorrect: 0,
                                    correct: 0,
                                  } as Score);
                                }
                              }
                            );
                            updatedMeData.scores =
                              updatedScores.concat(newScores);

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
        <Stack spacing={4}>
          {meData.me.questionReviews.slice(0, 5).map((questionReview) => (
            <Box key={questionReview.questionId} mt={2}>
              <Box>
                <Flex wrap="wrap">
                  {questionReview.question.subjects.map((subject) => (
                    <Flex align="center" key={subject} mr={2}>
                      <Circle
                        mr="4px"
                        size="12px"
                        bg={
                          subjectToColors[subject]
                            ? subjectToColors[subject]
                            : "grayMain"
                        }
                      />
                      <Text fontSize="xs">{"#" + subject}</Text>
                    </Flex>
                  ))}
                </Flex>
              </Box>
              <Text fontWeight="bold" fontSize="md">
                {questionReview.question.text}
              </Text>
              <Flex mt={1} wrap="wrap">
                <NextLink href={"/review/" + questionReview.questionId}>
                  <Link
                    mr={2}
                    color={
                      new Date().getTime() >=
                      new Date(questionReview.dateNextAvailable).getTime()
                        ? "iris"
                        : "grayMain"
                    }
                    _hover={{
                      color:
                        new Date().getTime() >=
                        new Date(questionReview.dateNextAvailable).getTime()
                          ? "irisDark"
                          : "gray.800",
                    }}
                    href={"/review/" + questionReview.questionId}
                  >
                    <Center>
                      <Icon as={GoChecklist} w="16px" height="16px" />
                      <Text ml={1} as="span" fontWeight="bold" fontSize="sm">
                        answer
                      </Text>
                    </Center>
                  </Link>
                </NextLink>
                <Center>
                  <StarIcon fontSize="sm" color="grayMain" mr={1.5} />
                  <Text fontSize="sm" color="grayMain" as="span">
                    {getTimeDifferenceString(
                      new Date(questionReview.createdAt),
                      new Date()
                    )}
                  </Text>
                </Center>
              </Flex>
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  ) : null;
};
