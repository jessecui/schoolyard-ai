import { ApolloCache, gql } from "@apollo/client";
import { DeleteIcon, HamburgerIcon } from "@chakra-ui/icons";
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
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { IoPeople, IoPersonCircle } from "react-icons/io5";
import {
  RiCalendarEventFill,
  RiThumbDownFill,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine,
} from "react-icons/ri";
import {
  AddQuestionVoteMutation,
  Question,
  QuestionReview,
  QuestionReviewDocument,
  QuestionReviewQuery,
  ReviewStatus,
  UpdateQuestionReviewMutation,
  useAddQuestionViewMutation,
  useAddQuestionVoteMutation,
  useDeleteQuestionReviewMutation,
  useMeQuery,
  useQuestionQuery,
  useQuestionReviewQuery,
  useUpdateQuestionReviewMutation,
  VoteType,
} from "../../generated/graphql";
import { withApollo } from "../../utils/withApollo";

const Review: React.FC<{}> = ({}) => {
  const router = useRouter();
  const { data, loading } = useQuestionQuery({
    variables: { id: router.query.id ? Number(router.query.id) : -1 },
  });
  const { data: meData, loading: meLoading } = useMeQuery();
  const [addVote] = useAddQuestionVoteMutation();
  const [addView] = useAddQuestionViewMutation();
  const [updateQuestionReview] = useUpdateQuestionReviewMutation();
  const [deleteQuestionReview] = useDeleteQuestionReviewMutation();

  const { data: reviewData, loading: reviewLoading } = useQuestionReviewQuery({
    variables: { questionId: router.query.id ? Number(router.query.id) : -1 },
  });
  const [questionAnswered, setQuestionAnswered] = useState(false);
  useEffect(() => {
    if (!meLoading && !meData?.me) {
      router.push("/");
    }
  });

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

  const updateAfterVote = (
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

  const updateQuestionReviewCache = (
    question: Question,
    cache: ApolloCache<UpdateQuestionReviewMutation>,
    responseData: UpdateQuestionReviewMutation
  ) => {
    let updatedQuestionReviews = meData!.me!.questionReviews.map((review) => {
      if (review.questionId != question.id) {
        return review;
      } else {
        let updatedReview = Object.assign({}, review);
        updatedReview.dateNextAvailable =
          responseData?.updateQuestionReview?.dateNextAvailable;
        updatedReview.reviewStatus = responseData?.updateQuestionReview
          ?.reviewStatus as ReviewStatus;
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

    let updatedReview = Object.assign({}, reviewData?.questionReview);
    updatedReview.dateNextAvailable =
      responseData?.updateQuestionReview?.dateNextAvailable;
    updatedReview.reviewStatus = responseData?.updateQuestionReview
      ?.reviewStatus as ReviewStatus;

    cache.writeQuery<QuestionReviewQuery>({
      query: QuestionReviewDocument,
      data: {
        questionReview: updatedReview,
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
            let reviewStatus;
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
            await addView({
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
                if (responseData) {
                  updateQuestionReviewCache(question, cache, responseData);
                }
              },
            });
            setQuestionAnswered(true);
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
                  <Text color="green">Correct Answer!</Text>
                ) : props.status === "incorrect" ? (
                  <Text color="red">Incorrect Answer.</Text>
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
            let reviewStatus;
            if (values.radioGroup === question.answer[0]) {
              setStatus("correct");
              reviewStatus = ReviewStatus.Correct;
            } else {
              setStatus("incorrect");
              reviewStatus = ReviewStatus.Incorrect;
            }
            await addView({
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
                if (responseData) {
                  updateQuestionReviewCache(question, cache, responseData);
                }
              },
            });
            setQuestionAnswered(true);
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
                              questionIsLocked ||
                              props.status === "correct" ||
                              props.status === "incorrect"
                            }
                          >
                            <Text ml={2} fontSize="16px">
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
                  <Text color="green">Correct Answer!</Text>
                ) : props.status === "incorrect" ? (
                  <Text color="red">Incorrect Answer.</Text>
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
            let reviewStatus;
            if (
              eqSet(new Set(values.checkboxGroup), new Set(question.answer))
            ) {
              setStatus("correct");
              reviewStatus = ReviewStatus.Correct;
            } else {
              setStatus("incorrect");
              reviewStatus = ReviewStatus.Incorrect;
            }
            await addView({
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
                if (responseData) {
                  updateQuestionReviewCache(question, cache, responseData);
                }
              },
            });
            setQuestionAnswered(true);
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
                            questionIsLocked ||
                            props.status === "correct" ||
                            props.status === "incorrect"
                          }
                        >
                          <Text ml={2} fontSize="16px">
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
                  <Text color="green">Correct Answer!</Text>
                ) : props.status === "incorrect" ? (
                  <Text color="red">Incorrect Answer.</Text>
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

  return data?.question ? (
    <>
      {router.query.questionDeleteSuccess && (
        <Alert status="success" mb={2}>
          <AlertIcon />
          Question successfully deleted
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
              <Text fontWeight="bold" fontSize="lg">
                {data.question.teacher.firstName}{" "}
                {data.question.teacher.lastName}
              </Text>
              <HStack spacing="6px">
                {data.question.subjects.map((subject) => (
                  <Flex
                    align="center"
                    key={String(data.question!.id) + subject}
                  >
                    <Circle mr="4px" size={4} bg="grayMain" />
                    <Text size="sm">{"#" + subject.toLowerCase()}</Text>
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
                onClick={() => {
                  deleteQuestionReview({
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
                    },
                  });
                  if (otherQuestions.length > 0) {
                    router.push(
                      "/review/" +
                        otherQuestions[0].questionId +
                        "?questionDeleteSuccess=true"
                    );
                  } else {
                    router.push("/?questionDeleteSuccess=true");
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
              <Text color="grayMain">
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
                    await addVote({
                      variables: {
                        questionId: data.question!.id,
                        voteType: VoteType.Up,
                      },
                      update: (cache, { data: responseData }) => {
                        const votedQuestion = responseData?.addQuestionVote;
                        updateAfterVote(
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
              <Text color="grayMain">
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
                    await addVote({
                      variables: {
                        questionId: data.question!.id,
                        voteType: VoteType.Down,
                      },
                      update: (cache, { data: responseData }) => {
                        const votedQuestion = responseData?.addQuestionVote;
                        updateAfterVote(
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
              <Text color="grayMain">
                <Icon
                  mx="4px"
                  height="24px"
                  as={RiThumbUpLine}
                  h="18px"
                  w="18px"
                />
                {data.question.upVoteCount}
              </Text>
              <Text color="grayMain">
                <Icon mx="4px" as={RiThumbDownLine} h="18px" w="18px" />
                {data.question.downVoteCount}
              </Text>
            </>
          )}

          <Text color="grayMain">
            <Icon as={IoPeople} mr={1} w={5} h={5} />
            {data.question.viewCount +
              (data.question.viewCount == 1 ? " view" : " views")}
          </Text>
          <Text color="grayMain">
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
        {questionAnswered && otherAvailableQuestions.length > 0 && (
          <Button
            onClick={() => {
              setQuestionAnswered(false);
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
    </>
  ) : null;
};

export default withApollo({ ssr: false })(Review);
