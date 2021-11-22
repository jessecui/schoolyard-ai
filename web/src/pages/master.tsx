import { ApolloCache } from "@apollo/client/cache";
import {
  Box,
  Circle,
  Divider,
  Flex, HStack,
  Stack
} from "@chakra-ui/layout";
import {
  Alert,
  AlertIcon,
  Button,
  Checkbox, CloseButton, FormControl,
  FormErrorMessage,
  Icon,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Text
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import gql from "graphql-tag";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { IoPeople, IoPersonCircle } from "react-icons/io5";
import {
  RiCalendarEventFill,
  RiThumbDownFill,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine
} from "react-icons/ri";
import {
  AddVoteMutation,
  MeQuery,
  Question,
  QuestionsQuery,
  useAddViewMutation,
  useAddVoteMutation,
  useMeQuery,
  useQuestionsQuery,
  VoteType
} from "../generated/graphql";
import { withApollo } from "../utils/withApollo";

const Master: React.FC<{}> = ({}) => {
  const router = useRouter();

  const { data, loading } = useQuestionsQuery({
    variables: {
      limit: 10,
      cursor: null,
    },
    notifyOnNetworkStatusChange: true,
  });
  const { data: meData, loading: meLoading } = useMeQuery();
  const [addVote] = useAddVoteMutation();
  const [addView] = useAddViewMutation();

  // Create our own states that set queried data only when component mounts
  // Avoids errors where the server renders differently than the client
  const [questionData, setQuestionData] = useState<
    QuestionsQuery | undefined
  >();
  const [questionDataLoading, setQuestionDataLoading] = useState<
    Boolean | undefined
  >();
  const [userData, setUserData] = useState<MeQuery | undefined>();
  const [userDataLoading, setUserDataLoading] = useState<Boolean | undefined>();
  useEffect(() => {
    setQuestionData(data);
    setQuestionDataLoading(loading);
    setUserData(meData);
    setUserDataLoading(meLoading);
  });

  const subjectColors = [
    "red.500",
    "orange.400",
    "yellow.400",
    "green.400",
    "teal.400",
    "blue.500",
    "cyan.400",
    "purple.400",
    "pink.400",
  ];

  // Create a map of subjects to colors sorted by count
  let displayedSubjects = new Array<string>();
  if (!questionDataLoading && questionData) {
    questionData.questions.questions.forEach((question) => {
      question.subjects.forEach((subject) => {
        displayedSubjects.push(subject);
      });
    });
  }

  let subjectCounts = new Map<string, number>();
  displayedSubjects.forEach((subject) => {
    subjectCounts.set(
      subject,
      subjectCounts.get(subject) ? subjectCounts.get(subject)! + 1 : 1
    );
  });

  let subjectToColorMap = new Map<string, string>();
  Array.from([...subjectCounts.entries()].sort((a, b) => b[1] - a[1])).forEach(
    (subject, index) => {
      if (index < subjectColors.length) {
        subjectToColorMap.set(subject[0], subjectColors[index]);
      } else {
        subjectToColorMap.set(subject[0], "gray.500");
      }
    }
  );

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

    const checkIfEmpty = (value: any) => {
      let error;
      if (!value) {
        error = "Please provide an answer.";
      }
      return error;
    };

    let input = null;
    if (question.questionType === "TEXT") {
      input = (
        <Formik
          initialValues={{ answerBox: "" }}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values: any, { setStatus }) => {
            if (
              values.answerBox.toLowerCase() ===
              question.answer[0].toLowerCase()
            ) {
              setStatus("correct");
            } else {
              setStatus("incorrect");
            }
            await addView({
              variables: {
                questionId: question.id,
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
                    props.status === "correct" || props.status === "incorrect"
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
            if (values.radioGroup === question.answer[0]) {
              setStatus("correct");
            } else {
              setStatus("incorrect");
            }
            await addView({
              variables: {
                questionId: question.id,
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
                    props.status === "correct" || props.status === "incorrect"
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
            if (
              eqSet(new Set(values.checkboxGroup), new Set(question.answer))
            ) {
              setStatus("correct");
            } else {
              setStatus("incorrect");
            }
            await addView({
              variables: {
                questionId: question.id,
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
                    props.status === "correct" || props.status === "incorrect"
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

  const updateAfterVote = (
    cache: ApolloCache<AddVoteMutation>,
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

  return (
    <Box>
      {router.query.deleteSuccess && (
        <Alert status="success" mb={2}>
          <AlertIcon />
          Question successfully deleted
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => router.push("/master", undefined, { shallow: true })}
          />
        </Alert>
      )}
      {!questionData ? null : (
        <Stack mb="16px">
          {questionData!.questions.questions.map((q) =>
            !q ? null : (
              <Box
                border="2px"
                borderColor="grayLight"
                borderRadius="md"
                bg="White"
                p={4}
                key={q.id}
              >
                <Flex align="center">
                  <Icon as={IoPersonCircle} color="iris" w={12} h={12} mr={2} />
                  <Box>
                    <Text fontWeight="bold" fontSize="lg">
                      {q.teacher.firstName} {q.teacher.lastName}
                    </Text>
                    <HStack spacing="6px">
                      {q.subjects.map((subject) => (
                        <Flex align="center" key={String(q.id) + subject}>
                          <Circle
                            mr="4px"
                            size={4}
                            bg={subjectToColorMap.get(subject)}
                          />
                          <Text size="sm">{"#" + subject.toLowerCase()}</Text>
                        </Flex>
                      ))}
                    </HStack>
                  </Box>
                </Flex>
                <Text my={2} fontWeight="bold" fontSize="xl">
                  {q.question}
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
                                questionId: q.id,
                                voteType: VoteType.Up,
                              },
                              update: (cache, { data }) => {
                                const votedQuestion = data?.addVote;
                                updateAfterVote(
                                  cache,
                                  q.id,
                                  votedQuestion!
                                    .userVoteType as VoteType | null,
                                  votedQuestion!.upVoteCount,
                                  votedQuestion!.downVoteCount
                                );
                              },
                            });
                          }}
                          aria-label="Up Vote Question"
                          icon={
                            q.userVoteType == VoteType.Up ? (
                              <RiThumbUpFill />
                            ) : (
                              <RiThumbUpLine />
                            )
                          }
                        />
                        {q.upVoteCount}
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
                                questionId: q.id,
                                voteType: VoteType.Down,
                              },
                              update: (cache, { data }) => {
                                const votedQuestion = data?.addVote;
                                updateAfterVote(
                                  cache,
                                  q.id,
                                  votedQuestion!
                                    .userVoteType as VoteType | null,
                                  votedQuestion!.upVoteCount,
                                  votedQuestion!.downVoteCount
                                );
                              },
                            });
                          }}
                          aria-label="Down Vote Question"
                          icon={
                            q.userVoteType == VoteType.Down ? (
                              <RiThumbDownFill />
                            ) : (
                              <RiThumbDownLine />
                            )
                          }
                        />
                        {q.downVoteCount}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text color="grayMain">
                        <Icon mx="4px" height="24px" as={RiThumbUpLine} h="18px" w="18px" />
                        {q.upVoteCount}
                      </Text>
                      <Text color="grayMain">
                        <Icon mx="4px" as={RiThumbDownLine} h="18px" w="18px" />
                        {q.downVoteCount}
                      </Text>
                    </>
                  )}

                  <Text color="grayMain">
                    <Icon as={IoPeople} mr={1} w={5} h={5} />
                    {q.viewCount +
                      (q.viewCount == 1 ? " person was" : " people were") +
                      " also curious"}
                  </Text>
                  <Text color="grayMain">
                    <Icon as={RiCalendarEventFill} mr={1} w={5} h={5} />
                    {new Date(q.createdAt).toLocaleString("default", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </HStack>
                <Divider borderColor="grayLight" border="1px" my={3} />
                <Box>{questionForm(q as Question)}</Box>
              </Box>
            )
          )}
        </Stack>
      )}
    </Box>
  );
};

export default withApollo({ ssr: true })(Master);
