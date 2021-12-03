import { ApolloCache, gql } from "@apollo/client";
import { DeleteIcon, StarIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Circle,
  CloseButton,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  HStack,
  Icon,
  IconButton,
  Input,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Radio,
  RadioGroup,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { BiDotsHorizontalRounded, BiZoomIn } from "react-icons/bi";
import { IoPeople, IoPersonCircle } from "react-icons/io5";
import {
  RiCalendarEventFill,
  RiThumbDownFill,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine,
} from "react-icons/ri";
import { ChangedSubject } from "../../components/SiteLayout";
import {
  AddQuestionVoteMutation,
  AddSentenceVoteMutation,
  MeDocument,
  MeQuery,
  Question,
  QuestionReview,
  QuestionReviewDocument,
  QuestionReviewQuery,
  ReviewStatus,
  Score,
  UpdateQuestionReviewMutation,
  useAddQuestionViewMutation,
  useAddQuestionVoteMutation,
  useAddSentenceVoteMutation,
  useCreateQuestionReviewMutation,
  useDeleteQuestionReviewMutation,
  useMeQuery,
  useQuestionQuery,
  useQuestionReviewQuery,
  User,
  useUpdateQuestionReviewMutation,
  VoteType,
} from "../../generated/graphql";
import { withApollo } from "../../utils/withApollo";

const Review: React.FC<{
  setActiveScoreSubjects: React.Dispatch<React.SetStateAction<string[]>>;
  setChangedSubjects: React.Dispatch<React.SetStateAction<ChangedSubject[]>>;
}> = ({ setActiveScoreSubjects, setChangedSubjects }) => {
  const router = useRouter();
  const { data, loading } = useQuestionQuery({
    variables: { id: router.query.id ? Number(router.query.id) : -1 },
  });
  const { data: meData, loading: meLoading } = useMeQuery();
  const [addQuestionVote] = useAddQuestionVoteMutation();
  const [addQuestionView] = useAddQuestionViewMutation();
  const [addSentenceVote] = useAddSentenceVoteMutation();
  const [createQuestionReview] = useCreateQuestionReviewMutation();
  const [updateQuestionReview] = useUpdateQuestionReviewMutation();
  const [deleteQuestionReview] = useDeleteQuestionReviewMutation();
  const { data: reviewData, loading: reviewLoading } = useQuestionReviewQuery({
    variables: { questionId: router.query.id ? Number(router.query.id) : -1 },
  });

  useEffect(() => {
    if (!meLoading && !meData?.me) {
      router.push("/");
    }
  });

  useEffect(() => {
    if (data?.question) {
      setActiveScoreSubjects(data.question.subjects);
    }
  }, [data?.question]);

  const createQuestionReviewAndUpdateCache = async () => {
    await createQuestionReview({
      variables: {
        questionId: Number(router.query.id),
        reviewStatus: ReviewStatus.Queued,
      },
      update: (cache, { data: responseData }) => {
        if (meData?.me && responseData?.createQuestionReview) {
          setActiveScoreSubjects(
            responseData.createQuestionReview.question.subjects
          );
          const cachedMeQuery = cache.readQuery<MeQuery>({
            query: MeDocument,
          });

          const updatedMeData = Object.assign({}, cachedMeQuery?.me) as User;

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
                const scoreIndex = updatedMeData.scores.findIndex(
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
            updatedMeData.scores = updatedScores.concat(newScores);

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
      refetchQueries: [QuestionReviewDocument],
    });
  };

  let otherQuestions: QuestionReview[] = [];
  let otherAvailableQuestions: QuestionReview[] = [];

  if (meData?.me && data?.question?.id) {
    const today = new Date().getTime();
    otherQuestions = Object.assign(
      [],
      meData.me.questionReviews
    ) as QuestionReview[];
    otherQuestions.sort(
      (a, b) =>
        new Date(b.dateNextAvailable).getTime() -
        new Date(a.dateNextAvailable).getTime()
    );
    otherQuestions = otherQuestions.filter((review) => {
      return review.questionId != data.question!.id;
    });
    otherAvailableQuestions = otherQuestions.filter((review) => {
      return today >= new Date(review.dateNextAvailable).getTime();
    });
  }

  const questionIsLocked = reviewData?.questionReview?.dateNextAvailable
    ? new Date().getTime() <
      new Date(reviewData.questionReview.dateNextAvailable).getTime()
    : false;

  const updateQuestionAfterVote = (
    cache: ApolloCache<AddQuestionVoteMutation>,
    questionId: number,
    newUserVoteType: VoteType | null,
    newUpVoteCount: number,
    newDownVoteCount: number
  ) => {
    if (data) {
      cache.writeFragment({
        id: "Question:" + questionId,
        fragment: gql`
          fragment __ on Question {
            upVoteCount
            downVoteCount
            userVoteType
          }
        `,
        data: {
          upVoteCount: newUpVoteCount,
          downVoteCount: newDownVoteCount,
          userVoteType: newUserVoteType,
        },
      });
    }
  };

  const updateAfterVote = (
    cache: ApolloCache<AddSentenceVoteMutation>,
    sentenceId: number,
    newUserVoteType: VoteType | null,
    newUpVoteCount: number,
    newDownVoteCount: number
  ) => {
    if (data) {
      cache.writeFragment({
        id: "Sentence:" + sentenceId,
        fragment: gql`
          fragment __ on Sentence {
            upVoteCount
            downVoteCount
            userVoteType
          }
        `,
        data: {
          upVoteCount: newUpVoteCount,
          downVoteCount: newDownVoteCount,
          userVoteType: newUserVoteType,
        },
      });
    }
  };

  const updateQuestionReviewCache = (
    question: Question,
    cache: ApolloCache<UpdateQuestionReviewMutation>,
    updatedQuestionReview: QuestionReview
  ) => {
    let updatedQuestionReviews = meData!.me!.questionReviews.map((review) => {
      if (review.questionId != question.id) {
        return review;
      } else {
        let updatedReview = Object.assign({}, review);
        updatedReview.dateNextAvailable =
          updatedQuestionReview?.dateNextAvailable;
        updatedReview.reviewStatus =
          updatedQuestionReview?.reviewStatus as ReviewStatus;
        return updatedReview;
      }
    });
    cache.writeFragment({
      id: "User:" + meData?.me?.id,
      fragment: gql`
        fragment _ on User {
          questionReviews
        }
      `,
      data: {
        questionReviews: updatedQuestionReviews,
      },
    });
    cache.writeQuery<QuestionReviewQuery>({
      query: QuestionReviewDocument,
      data: {
        questionReview: updatedQuestionReview,
      },
      variables: {
        questionId: question.id,
      },
    });
  };

  const checkIfEmpty = (value: any) => {
    let error;
    if (!value) {
      error = "Please provide an answer.";
    }
    return error;
  };

  const questionForm = (question: Question) => {
    const textHelper = (
      <Text color="grayMain" fontSize="sm" mb={2}>
        {question.questionType === "TEXT"
          ? "Type the correct answer"
          : question.questionType === "SINGLE"
          ? "Select the correct answer"
          : question.questionType === "MULTIPLE"
          ? "Select all that apply"
          : null}
      </Text>
    );

    let input = null;
    if (question.questionType === "TEXT") {
      input = (
        <Formik
          initialValues={{ answerBox: "" }}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values: any, { setStatus }) => {
            let reviewStatus: ReviewStatus;
            if (
              values.answerBox.toLowerCase() ===
              question.answer[0].toLowerCase()
            ) {
              setStatus("correct");
              reviewStatus = ReviewStatus.Correct;
            } else {
              setStatus("incorrect");
              reviewStatus = ReviewStatus.Incorrect;
            }
            await addQuestionView({
              variables: {
                questionId: question.id,
              },
            });
            await updateQuestionReview({
              variables: {
                questionId: question.id,
                reviewStatus,
              },
              update: (cache, { data: responseData }) => {
                if (responseData?.updateQuestionReview) {
                  updateQuestionReviewCache(
                    question,
                    cache,
                    responseData.updateQuestionReview as QuestionReview
                  );
                  if (reviewData?.questionReview?.reviewStatus) {
                    updateScorecardAfterUpdateQuestionReview(
                      cache,
                      responseData.updateQuestionReview.question.subjects,
                      reviewData.questionReview.reviewStatus,
                      reviewStatus
                    );
                  }
                }
              },
            });
          }}
        >
          {(props) => (
            <Form>
              <Field name="answerBox" validate={checkIfEmpty}>
                {({ field, form }: any) => (
                  <FormControl
                    isInvalid={form.errors.answerBox && form.touched.answerBox}
                  >
                    <Input
                      {...field}
                      size="sm"
                      border="2px"
                      borderColor="grayLight"
                      isDisabled={
                        !reviewData?.questionReview ||
                        questionIsLocked ||
                        props.status === "correct" ||
                        props.status === "incorrect"
                      }
                    />
                    <FormErrorMessage>{form.errors.answerBox}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <HStack align="center" mt={4}>
                <Button
                  isLoading={props.isSubmitting}
                  isDisabled={
                    !reviewData?.questionReview ||
                    questionIsLocked ||
                    props.status === "correct" ||
                    props.status === "incorrect"
                  }
                  bg="blueSky"
                  color="white"
                  size="sm"
                  type="submit"
                  _disabled={{
                    bg: "grayLight",
                  }}
                  _hover={{
                    bg: "blue.800",
                    _disabled: {
                      bg: "grayLight",
                    },
                  }}
                >
                  Submit
                </Button>

                {props.status === "correct" ? (
                  <Text color="green" fontSize="md">
                    Correct Answer!
                  </Text>
                ) : props.status === "incorrect" ? (
                  <Text color="red" fontSize="md">
                    Incorrect Answer.
                  </Text>
                ) : null}
              </HStack>
            </Form>
          )}
        </Formik>
      );
    } else if (question.questionType === "SINGLE") {
      input = (
        <Formik
          initialValues={{ radioGroup: "" }}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values: any, { setStatus }) => {
            let reviewStatus: ReviewStatus;
            if (values.radioGroup === question.answer[0]) {
              setStatus("correct");
              reviewStatus = ReviewStatus.Correct;
            } else {
              setStatus("incorrect");
              reviewStatus = ReviewStatus.Incorrect;
            }
            await addQuestionView({
              variables: {
                questionId: question.id,
              },
            });
            await updateQuestionReview({
              variables: {
                questionId: question.id,
                reviewStatus,
              },
              update: (cache, { data: responseData }) => {
                if (responseData?.updateQuestionReview) {
                  updateQuestionReviewCache(
                    question,
                    cache,
                    responseData.updateQuestionReview as QuestionReview
                  );
                  if (reviewData?.questionReview?.reviewStatus) {
                    updateScorecardAfterUpdateQuestionReview(
                      cache,
                      responseData.updateQuestionReview.question.subjects,
                      reviewData.questionReview.reviewStatus,
                      reviewStatus
                    );
                  }
                }
              },
            });
          }}
        >
          {(props) => (
            <Form>
              <Field name="radioGroup" validate={checkIfEmpty}>
                {({ field, form }: any) => (
                  <FormControl
                    isInvalid={
                      form.errors.radioGroup && form.touched.radioGroup
                    }
                  >
                    <RadioGroup {...field}>
                      <Flex direction="column">
                        {question.choices!.map((choice) => (
                          <Radio
                            {...field}
                            size="lg"
                            borderColor="grayMain"
                            colorScheme="gray"
                            key={String(question.id) + choice}
                            value={choice}
                            my="4px"
                            isDisabled={
                              !reviewData?.questionReview ||
                              questionIsLocked ||
                              props.status === "correct" ||
                              props.status === "incorrect"
                            }
                          >
                            <Text ml={2} fontSize="lg">
                              {choice}
                            </Text>
                          </Radio>
                        ))}
                      </Flex>
                    </RadioGroup>
                    <FormErrorMessage>
                      {form.errors.radioGroup}
                    </FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <HStack align="center" mt={4}>
                <Button
                  isLoading={props.isSubmitting}
                  isDisabled={
                    !reviewData?.questionReview ||
                    questionIsLocked ||
                    props.status === "correct" ||
                    props.status === "incorrect"
                  }
                  bg="blueSky"
                  color="white"
                  size="sm"
                  type="submit"
                  _disabled={{
                    bg: "grayLight",
                  }}
                  _hover={{
                    bg: "blue.800",
                    _disabled: {
                      bg: "grayLight",
                    },
                  }}
                >
                  Submit
                </Button>

                {props.status === "correct" ? (
                  <Text color="green" fontSize="md">
                    Correct Answer!
                  </Text>
                ) : props.status === "incorrect" ? (
                  <Text color="red" fontSize="md">
                    Incorrect Answer.
                  </Text>
                ) : null}
              </HStack>
            </Form>
          )}
        </Formik>
      );
    } else if (question.questionType === "MULTIPLE") {
      input = (
        <Formik
          initialValues={{ checkboxGroup: [] }}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values: any, { setStatus }) => {
            const eqSet = (as: Set<any>, bs: Set<any>) => {
              if (as.size !== bs.size) return false;
              for (var a of as) if (!bs.has(a)) return false;
              return true;
            };
            let reviewStatus: ReviewStatus;
            if (
              eqSet(new Set(values.checkboxGroup), new Set(question.answer))
            ) {
              setStatus("correct");
              reviewStatus = ReviewStatus.Correct;
            } else {
              setStatus("incorrect");
              reviewStatus = ReviewStatus.Incorrect;
            }
            await addQuestionView({
              variables: {
                questionId: question.id,
              },
            });
            await updateQuestionReview({
              variables: {
                questionId: question.id,
                reviewStatus,
              },
              update: (cache, { data: responseData }) => {
                if (responseData?.updateQuestionReview) {
                  updateQuestionReviewCache(
                    question,
                    cache,
                    responseData.updateQuestionReview as QuestionReview
                  );
                  if (reviewData?.questionReview?.reviewStatus) {
                    updateScorecardAfterUpdateQuestionReview(
                      cache,
                      responseData.updateQuestionReview.question.subjects,
                      reviewData.questionReview.reviewStatus,
                      reviewStatus
                    );
                  }
                }
              },
            });
          }}
        >
          {(props) => (
            <Form>
              <Field name="checkboxGroup">
                {({ field, form }: any) => (
                  <FormControl
                    isInvalid={
                      form.errors.checkboxGroup && form.touched.checkboxGroup
                    }
                  >
                    <Stack>
                      {question.choices!.map((choice) => (
                        <Checkbox
                          {...field}
                          size="lg"
                          borderColor="grayMain"
                          colorScheme="gray"
                          key={String(question.id) + choice}
                          value={choice}
                          isDisabled={
                            !reviewData?.questionReview ||
                            questionIsLocked ||
                            props.status === "correct" ||
                            props.status === "incorrect"
                          }
                        >
                          <Text ml={2} fontSize="lg">
                            {choice}
                          </Text>
                        </Checkbox>
                      ))}
                    </Stack>
                    <FormErrorMessage>
                      {form.errors.checkboxGroup}
                    </FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <HStack align="center" mt={4}>
                <Button
                  isLoading={props.isSubmitting}
                  isDisabled={
                    !reviewData?.questionReview ||
                    questionIsLocked ||
                    props.status === "correct" ||
                    props.status === "incorrect"
                  }
                  bg="blueSky"
                  color="white"
                  size="sm"
                  type="submit"
                  _disabled={{
                    bg: "grayLight",
                  }}
                  _hover={{
                    bg: "blue.800",
                    _disabled: {
                      bg: "grayLight",
                    },
                  }}
                >
                  Submit
                </Button>

                {props.status === "correct" ? (
                  <Text color="green" fontSize="md">
                    Correct Answer!
                  </Text>
                ) : props.status === "incorrect" ? (
                  <Text color="red" fontSize="md">
                    Incorrect Answer.
                  </Text>
                ) : null}
              </HStack>
            </Form>
          )}
        </Formik>
      );
    }

    return (
      <Box>
        <Box mt={4}>
          {textHelper}
          {input}
        </Box>
      </Box>
    );
  };

  let subjectToColors: Record<string, string> = {};
  if (meData?.me?.subjectColors) {
    subjectToColors = JSON.parse(meData.me.subjectColors);
  }

  const updateScorecardAfterUpdateQuestionReview = (
    cache: ApolloCache<UpdateQuestionReviewMutation>,
    subjects: string[],
    oldStatus: ReviewStatus,
    newStatus: ReviewStatus
  ) => {
    if (meData?.me) {
      setActiveScoreSubjects(subjects);

      setChangedSubjects(
        subjects.map((subject) => {
          return {
            subject,
            oldStatus,
            newStatus,
          };
        })
      );

      const cachedMeQuery = cache.readQuery<MeQuery>({
        query: MeDocument,
      });
      const updatedMeData = Object.assign({}, cachedMeQuery?.me) as User;

      if (updatedMeData) {
        const updatedScores = Object.assign(
          [],
          updatedMeData.scores
        ) as Score[];

        subjects.forEach((subject) => {
          const scoreIndex = updatedMeData.scores.findIndex(
            (score) => score.subjectName == subject
          );
          if (scoreIndex >= 0) {
            const updatedScore = Object.assign({}, updatedScores[scoreIndex]);
            updatedScore.queued =
              oldStatus == ReviewStatus.Queued
                ? updatedScore.queued - 1
                : newStatus == ReviewStatus.Queued
                ? updatedScore.queued + 1
                : updatedScore.queued;
            updatedScore.incorrect =
              oldStatus == ReviewStatus.Incorrect
                ? updatedScore.incorrect - 1
                : newStatus == ReviewStatus.Incorrect
                ? updatedScore.incorrect + 1
                : updatedScore.incorrect;
            updatedScore.correct =
              oldStatus == ReviewStatus.Correct
                ? updatedScore.correct - 1
                : newStatus == ReviewStatus.Correct
                ? updatedScore.correct + 1
                : updatedScore.correct;
            updatedScores[scoreIndex] = updatedScore;
          }
        });
        updatedMeData.scores = updatedScores;
        cache.writeQuery<MeQuery>({
          query: MeDocument,
          data: {
            __typename: "Query",
            me: updatedMeData,
          },
        });
      }
    }
  };

  return data?.question ? (
    <>
      {router.query.questionDeleteSuccess && (
        <Alert status="success" mb={2}>
          <AlertIcon />
          <Text fontSize="lg">Question successfully deleted</Text>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() =>
              router.push("/review/" + router.query.id, undefined, {
                shallow: true,
              })
            }
          />
        </Alert>
      )}
      <Box
        border="2px"
        borderColor="grayLight"
        borderRadius="md"
        bg="White"
        p={4}
        key={data.question.id}
      >
        <Flex>
          <Flex align="center" width="80%">
            <Icon as={IoPersonCircle} color="iris" w={12} h={12} mr={2} />
            <Box>
              <Text fontWeight="bold" fontSize="md">
                {data.question.teacher.firstName}{" "}
                {data.question.teacher.lastName}
              </Text>
              <HStack spacing="6px">
                {data.question.subjects.map((subject) => (
                  <Flex
                    align="center"
                    key={String(data.question!.id) + subject}
                  >
                    <Circle
                      mr="4px"
                      size="12px"
                      bg={
                        subjectToColors[subject]
                          ? subjectToColors[subject]
                          : "grayMain"
                      }
                    />
                    <Text fontSize="sm">{"#" + subject.toLowerCase()}</Text>
                  </Flex>
                ))}
              </HStack>
            </Box>
          </Flex>
          <Spacer />
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={<Icon as={BiDotsHorizontalRounded} />}
              variant="outline"
            />
            <MenuList>
              <MenuItem
                icon={<DeleteIcon fontSize="md" />}
                onClick={async () => {
                  await deleteQuestionReview({
                    variables: {
                      questionId: data.question?.id ? data.question.id : -1,
                    },
                    update: (cache) => {
                      cache.evict({
                        fieldName: "questionReview",
                        args: { questionId: data.question?.id },
                      });
                      let updatedQuestionReviews =
                        meData!.me!.questionReviews.filter(
                          (review) => review.questionId != data.question?.id
                        );

                      // Delete from question review cache
                      cache.writeFragment({
                        id: "User:" + meData?.me?.id,
                        fragment: gql`
                          fragment _ on User {
                            questionReviews
                          }
                        `,
                        data: {
                          questionReviews: updatedQuestionReviews,
                        },
                      });

                      // Delete from scores cache
                      const cachedMeQuery = cache.readQuery<MeQuery>({
                        query: MeDocument,
                      });
                      const updatedMeData = Object.assign(
                        {},
                        cachedMeQuery?.me
                      ) as User;

                      if (updatedMeData) {
                        let updatedScores = Object.assign(
                          [],
                          updatedMeData.scores
                        ) as Score[];

                        data.question!.subjects.forEach((subject) => {
                          const scoreIndex = updatedMeData.scores.findIndex(
                            (score) => score.subjectName == subject
                          );
                          if (scoreIndex >= 0) {
                            const updatedScore = Object.assign(
                              {},
                              updatedScores[scoreIndex]
                            );
                            updatedScore.queued =
                              reviewData?.questionReview?.reviewStatus ==
                              ReviewStatus.Queued
                                ? updatedScore.queued - 1
                                : updatedScore.queued;
                            updatedScore.incorrect =
                              reviewData?.questionReview?.reviewStatus ==
                              ReviewStatus.Incorrect
                                ? updatedScore.incorrect - 1
                                : updatedScore.incorrect;
                            updatedScore.correct =
                              reviewData?.questionReview?.reviewStatus ==
                              ReviewStatus.Correct
                                ? updatedScore.correct - 1
                                : updatedScore.correct;
                            updatedScores[scoreIndex] = updatedScore;
                          }
                        });
                        updatedScores = updatedScores.filter(
                          (score) =>
                            score.queued || score.incorrect || score.correct
                        );
                        updatedMeData.scores = updatedScores;

                        cache.writeQuery<MeQuery>({
                          query: MeDocument,
                          data: {
                            __typename: "Query",
                            me: updatedMeData,
                          },
                        });
                      }
                    },
                  });
                  if (otherQuestions.length > 0) {
                    router.push(
                      "/review/" +
                        otherQuestions[0].questionId +
                        "?questionDeleteSuccess=true"
                    );
                  } else {
                    router.push("/review/");
                  }
                }}
              >
                <Text fontSize="md">Delete Question</Text>
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        <Text my={2} fontWeight="bold" fontSize="xl">
          {data.question.question}
        </Text>
        <HStack spacing={4}>
          {!meLoading && meData ? (
            <>
              <Text color="grayMain" fontSize="sm">
                <IconButton
                  mr={1}
                  minWidth="24px"
                  height="24px"
                  isRound={true}
                  size="lg"
                  bg="none"
                  _focus={{
                    boxShadow: "none",
                  }}
                  _hover={{
                    bg: "grayLight",
                  }}
                  onClick={async () => {
                    await addQuestionVote({
                      variables: {
                        questionId: data.question!.id,
                        voteType: VoteType.Up,
                      },
                      update: (cache, { data: responseData }) => {
                        const votedQuestion = responseData?.addQuestionVote;
                        updateQuestionAfterVote(
                          cache,
                          data.question!.id,
                          votedQuestion!.userVoteType as VoteType | null,
                          votedQuestion!.upVoteCount,
                          votedQuestion!.downVoteCount
                        );
                      },
                    });
                  }}
                  aria-label="Up Vote Question"
                  icon={
                    data.question.userVoteType == VoteType.Up ? (
                      <RiThumbUpFill />
                    ) : (
                      <RiThumbUpLine />
                    )
                  }
                />
                {data.question.upVoteCount}
              </Text>
              <Text color="grayMain" fontSize="sm">
                <IconButton
                  mr={1}
                  minWidth="24px"
                  height="24px"
                  isRound={true}
                  size="lg"
                  bg="none"
                  _focus={{
                    boxShadow: "none",
                  }}
                  _hover={{
                    bg: "grayLight",
                  }}
                  onClick={async () => {
                    await addQuestionVote({
                      variables: {
                        questionId: data.question!.id,
                        voteType: VoteType.Down,
                      },
                      update: (cache, { data: responseData }) => {
                        const votedQuestion = responseData?.addQuestionVote;
                        updateQuestionAfterVote(
                          cache,
                          data.question!.id,
                          votedQuestion!.userVoteType as VoteType | null,
                          votedQuestion!.upVoteCount,
                          votedQuestion!.downVoteCount
                        );
                      },
                    });
                  }}
                  aria-label="Down Vote Question"
                  icon={
                    data.question.userVoteType == VoteType.Down ? (
                      <RiThumbDownFill />
                    ) : (
                      <RiThumbDownLine />
                    )
                  }
                />
                {data.question.downVoteCount}
              </Text>
            </>
          ) : (
            <>
              <Text color="grayMain" fontSize="sm">
                <Icon
                  mx="4px"
                  height="24px"
                  as={RiThumbUpLine}
                  h="18px"
                  w="18px"
                />
                {data.question.upVoteCount}
              </Text>
              <Text color="grayMain" fontSize="sm">
                <Icon mx="4px" as={RiThumbDownLine} h="18px" w="18px" />
                {data.question.downVoteCount}
              </Text>
            </>
          )}

          <Text color="grayMain" fontSize="sm">
            <Icon as={IoPeople} mr={1} w={5} h={5} />
            {data.question.viewCount +
              (data.question.viewCount == 1 ? " view" : " views")}
          </Text>
          <Text color="grayMain" fontSize="sm">
            <Icon as={RiCalendarEventFill} mr={1} w={5} h={5} />
            {new Date(data.question.createdAt).toLocaleString("default", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </HStack>
        <Divider borderColor="grayLight" border="1px" my={3} />
        <Box>{questionForm(data.question as Question)}</Box>
        {reviewData?.questionReview && questionIsLocked && (
          <Box mt={2}>
            <Text fontSize="sm">
              You answered this question{" "}
              {reviewData.questionReview.reviewStatus == ReviewStatus.Correct
                ? "correctly"
                : "incorrectly"}{" "}
              on{" "}
              {new Date(reviewData.questionReview.dateUpdated).toLocaleString()}
              . It will be locked until{" "}
              {new Date(
                reviewData.questionReview.dateNextAvailable
              ).toLocaleString()}
              .
            </Text>
          </Box>
        )}
        {questionIsLocked && otherAvailableQuestions.length > 0 && (
          <Button
            onClick={() => {
              router.push("/review/" + otherAvailableQuestions[0].questionId);
            }}
            bg="iris"
            mt={2}
            color="white"
            _hover={{
              bg: "irisDark",
            }}
            size="sm"
            type="submit"
          >
            Next Question
          </Button>
        )}
      </Box>
      {!reviewData?.questionReview && (
        <Box
          border="2px"
          borderColor="grayLight"
          borderRadius="md"
          bg="White"
          p={4}
          mt={2}
        >
          <Text fontSize="lg">
            You have not saved this question yet. This question can be answered
            once you save it.
          </Text>
          <Button
            mt={1}
            bg="mint"
            color="white"
            size="sm"
            onClick={() => createQuestionReviewAndUpdateCache()}
          >
            <StarIcon mr={2} />
            <Text as="span" fontSize="lg">
              save question
            </Text>
          </Button>
        </Box>
      )}
      {data.question.sentence && questionIsLocked && (
        <Box
          border="2px"
          borderColor="grayLight"
          borderRadius="md"
          bg="White"
          p={4}
          mt={2}
        >
          <Text fontWeight="bold" color="grayMain" fontSize="md" pb={2}>
            Learn Again
          </Text>
          <Flex>
            <Flex align="center" width="80%">
              <Icon as={IoPersonCircle} color="iris" w={12} h={12} mr={2} />
              <Box>
                <Text fontWeight="bold" fontSize="md">
                  {data.question.sentence.teacher.firstName}{" "}
                  {data.question.sentence.teacher.lastName}
                </Text>
                <HStack spacing="6px">
                  {data.question.sentence.subjects.map((subject) => (
                    <Flex align="center" key={subject}>
                      <Circle
                        mr="4px"
                        size="12px"
                        bg={
                          subjectToColors[subject]
                            ? subjectToColors[subject]
                            : "grayMain"
                        }
                      />
                      <Text fontSize="sm" whiteSpace="nowrap">
                        {"#" + subject.toLowerCase()}
                      </Text>
                    </Flex>
                  ))}
                </HStack>
              </Box>
            </Flex>
          </Flex>
          <Text my={2} fontWeight="bold" fontSize="xl">
            {data.question.sentence.text}
          </Text>
          <Text my={2} fontSize="lg">
            {data.question.sentence.children
              ? data.question.sentence.children
                  .map((child) => child.text)
                  .join(" ")
              : null}
          </Text>
          <HStack spacing={4}>
            {!meLoading && meData?.me ? (
              <>
                <Text color="grayMain" fontSize="sm">
                  <IconButton
                    mr={1}
                    minWidth="24px"
                    height="24px"
                    isRound={true}
                    size="lg"
                    bg="none"
                    _focus={{
                      boxShadow: "none",
                    }}
                    _hover={{
                      bg: "grayLight",
                    }}
                    onClick={async () => {
                      await addSentenceVote({
                        variables: {
                          sentenceId: data.question!.sentence!.id,
                          voteType: VoteType.Up,
                        },
                        update: (cache, { data: responseData }) => {
                          const votedSentence = responseData?.addSentenceVote;
                          updateAfterVote(
                            cache,
                            data.question!.sentence!.id,
                            votedSentence!.userVoteType as VoteType | null,
                            votedSentence!.upVoteCount,
                            votedSentence!.downVoteCount
                          );
                        },
                      });
                    }}
                    aria-label="Up Vote Sentence"
                    icon={
                      data.question.sentence.userVoteType == VoteType.Up ? (
                        <RiThumbUpFill />
                      ) : (
                        <RiThumbUpLine />
                      )
                    }
                  />
                  {data.question.sentence.upVoteCount}
                </Text>
                <Text color="grayMain" fontSize="sm">
                  <IconButton
                    mr={1}
                    minWidth="24px"
                    height="24px"
                    isRound={true}
                    size="lg"
                    bg="none"
                    _focus={{
                      boxShadow: "none",
                    }}
                    _hover={{
                      bg: "grayLight",
                    }}
                    onClick={async () => {
                      await addSentenceVote({
                        variables: {
                          sentenceId: data.question!.sentence!.id,
                          voteType: VoteType.Down,
                        },
                        update: (cache, { data: responseData }) => {
                          const votedSentence = responseData?.addSentenceVote;
                          updateAfterVote(
                            cache,
                            data.question!.sentence!.id,
                            votedSentence!.userVoteType as VoteType | null,
                            votedSentence!.upVoteCount,
                            votedSentence!.downVoteCount
                          );
                        },
                      });
                    }}
                    aria-label="Down Vote Sentence"
                    icon={
                      data.question.sentence.userVoteType == VoteType.Down ? (
                        <RiThumbDownFill />
                      ) : (
                        <RiThumbDownLine />
                      )
                    }
                  />
                  {data.question.sentence.downVoteCount}
                </Text>
              </>
            ) : (
              <>
                <Text color="grayMain" fontSize="sm">
                  <Icon
                    mx="4px"
                    height="24px"
                    as={RiThumbUpLine}
                    h="18px"
                    w="18px"
                  />
                  {data.question.sentence.upVoteCount}
                </Text>
                <Text color="grayMain" fontSize="sm">
                  <Icon mx="4px" as={RiThumbDownLine} h="18px" w="18px" />
                  {data.question.sentence.downVoteCount}
                </Text>
              </>
            )}

            <Text color="grayMain" fontSize="sm">
              <Icon as={IoPeople} mr={1} w={5} h={5} />
              {data.question.sentence.viewCount +
                (data.question.sentence.viewCount == 1 ? " view" : " views")}
            </Text>
            <Text color="grayMain" fontSize="sm">
              <Icon as={RiCalendarEventFill} mr={1} w={5} h={5} />
              {new Date(data.question.sentence.createdAt).toLocaleString(
                "default",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              )}
            </Text>
          </HStack>
          <Box mt={3}>
            <NextLink href={"/learn/" + data.question.sentence.id}>
              <Link
                color="iris"
                _hover={{ color: "irisDark" }}
                href={"/learn/" + data.question.sentence.id}
              >
                <Icon as={BiZoomIn} w="24px" height="24px" />
                <Text ml={1} as="span" fontWeight="bold" fontSize="md">
                  zoom in
                </Text>
              </Link>
            </NextLink>
          </Box>
        </Box>
      )}
    </>
  ) : null;
};

export default withApollo({ ssr: false })(Review);
