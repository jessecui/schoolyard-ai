import { useRouter } from "next/router";
import {
  AddQuestionVoteMutation,
  Question,
  useAddQuestionViewMutation,
  useAddQuestionVoteMutation,
  useMeQuery,
  useQuestionQuery,
  VoteType,
} from "../../generated/graphql";
import { withApollo } from "../../utils/withApollo";
import {
  Box,
  Button,
  Checkbox,
  Circle,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  HStack,
  Icon,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { Formik, Form, Field } from "formik";
import { IoPersonCircle, IoPeople } from "react-icons/io5";
import {
  RiThumbUpFill,
  RiThumbUpLine,
  RiThumbDownFill,
  RiThumbDownLine,
  RiCalendarEventFill,
} from "react-icons/ri";
import { ApolloCache, gql } from "@apollo/client";

const Review: React.FC<{}> = ({}) => {
  const router = useRouter();
  const { data, loading } = useQuestionQuery({
    variables: { id: Number(router.query.id) },
  });
  const { data: meData, loading: meLoading } = useMeQuery();
  const [addVote] = useAddQuestionVoteMutation();
  const [addView] = useAddQuestionViewMutation();

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

  return data?.question ? (
    <Box
      border="2px"
      borderColor="grayLight"
      borderRadius="md"
      bg="White"
      p={4}
      key={data.question.id}
    >
      <Flex align="center">
        <Icon as={IoPersonCircle} color="iris" w={12} h={12} mr={2} />
        <Box>
          <Text fontWeight="bold" fontSize="lg">
            {data.question.teacher.firstName} {data.question.teacher.lastName}
          </Text>
          <HStack spacing="6px">
            {data.question.subjects.map((subject) => (
              <Flex align="center" key={String(data.question!.id) + subject}>
                <Circle mr="4px" size={4} bg="grayMain" />
                <Text size="sm">{"#" + subject.toLowerCase()}</Text>
              </Flex>
            ))}
          </HStack>
        </Box>
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
    </Box>
  ) : null;
};

export default withApollo({ ssr: false })(Review);
