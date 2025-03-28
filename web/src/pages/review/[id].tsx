import { ApolloCache, gql } from "@apollo/client";
import { DeleteIcon, StarIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Avatar,
  Box,
  Button,
  Center,
  Checkbox,
  Circle,
  CloseButton,
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
import React, { useEffect } from "react";
import { BiDotsHorizontalRounded, BiZoomIn } from "react-icons/bi";
import { RiEditBoxLine } from "react-icons/ri";
import { Details } from "../../components/content/Details";
import { ChangedSubject } from "../../components/layout/SiteLayout";
import {
  MeDocument,
  MeQuery,
  Question,
  QuestionReview,
  QuestionReviewDocument,
  QuestionReviewQuery,
  ReviewStatus,
  Score,
  Sentence,
  UpdateQuestionReviewMutation,
  useAddQuestionViewMutation,
  useCreateQuestionReviewMutation,
  useDeleteQuestionReviewMutation,
  useMeQuery,
  useQuestionQuery,
  useQuestionReviewQuery,
  User,
  useUpdateQuestionReviewMutation,
} from "../../graphql/generated/graphql";
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
  const [addQuestionView] = useAddQuestionViewMutation();
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
    if (reviewData?.questionReview && data?.question) {
      setChangedSubjects(
        data.question.subjects.map((subject) => {
          return {
            subject: subject,
            oldStatus: reviewData.questionReview?.reviewStatus!,
            newStatus: reviewData.questionReview?.reviewStatus!,
          };
        })
      );
    }
  }, [reviewData?.questionReview, data?.question]);

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
            onClick={() => router.push("/review/" + router.query.id)}
          />
        </Alert>
      )}
      <Box
        border="2px"
        borderColor="grayLight"
        borderRadius="md"
        bg="White"
        p={4}
        mb={2}
        key={data.question.id}
      >
        <Flex>
          <Flex align="center" width="80%">
            {data.question.creator.photoUrl ? (
              <Avatar
                size="md"
                bg="white"
                name={
                  data.question.creator.firstName +
                  " " +
                  data.question.creator.lastName
                }
                src={`${data.question.creator.photoUrl}`}
                mr={2}
                color="white"
              />
            ) : (
              <Avatar size="md" bg="iris" mr={2} />
            )}
            <Box>
              <Text fontWeight="bold" fontSize="md">
                {data.question.creator.firstName}{" "}
                {data.question.creator.lastName}
              </Text>
              <Flex wrap="wrap">
                {data.question.subjects.map((subject) => (
                  <Flex
                    align="center"
                    key={String(data.question!.id) + subject}
                    mr={2}
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
              </Flex>
            </Box>
          </Flex>
          <Spacer />
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={<Icon as={BiDotsHorizontalRounded} />}
              variant="outline"
              isRound={true}
              size="md"
              _focus={{ boxShadow: "none" }}
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
                <Text fontSize="md">Delete Review Question</Text>
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        <Text my={2} fontWeight="bold" fontSize="xl">
          {data.question.text}
        </Text>
        <Details
          content={data.question as Question}
          userLoggedIn={Boolean(meData?.me)}
        />
        <Box>{questionForm(data.question as Question)}</Box>
        {reviewData?.questionReview && questionIsLocked && (
          <Box my={2}>
            <Text fontSize="sm">
              You answered this question{" "}
              {reviewData.questionReview.reviewStatus == ReviewStatus.Correct
                ? "correctly"
                : "incorrectly"}{" "}
              on{" "}
              {new Date(reviewData.questionReview.updatedAt).toLocaleString()}.
              It will be locked until{" "}
              {new Date(
                reviewData.questionReview.dateNextAvailable
              ).toLocaleString()}
              .
            </Text>
          </Box>
        )}
        <HStack mt={4}>
          {questionIsLocked && otherAvailableQuestions.length > 0 && (
            <Button
              onClick={() => {
                router.push("/review/" + otherAvailableQuestions[0].questionId);
              }}
              bg="iris"
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
          {meData?.me?.id == data.question.creatorId && (
            <NextLink href={"/edit/question/" + data.question.id}>
              <Link
                color="red.400"
                _hover={{ color: "red.800" }}
                href={"/edit/question/" + data.question.id}
              >
                <Center alignItems="left" justifyContent="left">
                  <Icon as={RiEditBoxLine} w="24px" height="24px" />
                  <Text
                    textAlign="left"
                    ml={1}
                    as="span"
                    fontWeight="bold"
                    fontSize="md"
                  >
                    edit
                  </Text>
                </Center>
              </Link>
            </NextLink>
          )}
        </HStack>
      </Box>
      {!reviewData?.questionReview && (
        <Box
          border="2px"
          borderColor="grayLight"
          borderRadius="md"
          bg="White"
          p={4}
          my={2}
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
          my={2}
        >
          <Text fontWeight="bold" color="grayMain" fontSize="md" pb={2}>
            Learn Again
          </Text>
          <Flex>
            <Flex align="center" width="80%">
              {data.question.creator.photoUrl ? (
                <Avatar
                  size="md"
                  bg="white"
                  name={`${data.question.sentence.creator.firstName} ${data.question.sentence.creator.lastName}`}
                  src={`${data.question.sentence.creator.photoUrl}`}
                  mr={2}
                  color="white"
                />
              ) : (
                <Avatar size="md" bg="iris" mr={2} />
              )}
              <Box>
                <Text fontWeight="bold" fontSize="md">
                  {data.question.sentence.creator.firstName}{" "}
                  {data.question.sentence.creator.lastName}
                </Text>
                <Flex wrap="wrap">
                  {data.question.sentence.subjects.map((subject) => (
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
                      <Text fontSize="sm" whiteSpace="nowrap">
                        {"#" + subject.toLowerCase()}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
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
          <Details
            content={data.question.sentence as Sentence}
            userLoggedIn={Boolean(meData?.me)}
          />
          <Box mt={3}>
            <NextLink href={"/learn/" + data.question.sentence.id}>
              <Link
                color="iris"
                _hover={{ color: "irisDark" }}
                href={"/learn/" + data.question.sentence.id}
              >
                <Center justifyContent="left">
                  <Icon as={BiZoomIn} w="24px" height="24px" />
                  <Text ml={1} as="span" fontWeight="bold" fontSize="md">
                    zoom in
                  </Text>
                </Center>
              </Link>
            </NextLink>
          </Box>
        </Box>
      )}
    </>
  ) : null;
};

export default withApollo({ ssr: false })(Review);
