import { ArrowBackIcon } from "@chakra-ui/icons";
import {
  Box,
  Circle,
  Divider,
  Flex,
  Grid,
  HStack,
  Stack,
} from "@chakra-ui/layout";
import {
  Avatar,
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormErrorMessage,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Field, FieldArray, Form, Formik, FormikProps } from "formik";
import { gql } from "@apollo/client";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { RiAddLine, RiSubtractLine } from "react-icons/ri";
import { InputField } from "../components/form/InputField";
import {
  MeQuery,
  QuestionType,
  useCreateParagraphMutation,
  useCreateQuestionMutation,
  useMeQuery,
  useSentenceQuery,
  useSetUserCanCreateMutation,
} from "../graphql/generated/graphql";
import { withApollo } from "../utils/withApollo";

export const Create: React.FC<{}> = ({}) => {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useMeQuery();
  const [userData, setUserData] = useState<MeQuery | undefined>();
  const [userDataLoading, setUserDataLoading] = useState<Boolean | undefined>();
  const { data: parentData, loading } = useSentenceQuery({
    variables: {
      id: Number(router.query.parent) ? Number(router.query.parent) : -1,
    },
  });
  const [createParagraph] = useCreateParagraphMutation();
  const [createQuestion] = useCreateQuestionMutation();
  const [setUserCanCreate] = useSetUserCanCreateMutation();

  const [contentType, setContentType] = useState("paragraph");

  useEffect(() => {
    if (!meLoading && !meData?.me) {
      router.push("/log-in");
    }
    setUserData(meData);
    setUserDataLoading(meLoading);
  });
  const checkIfEmpty = (value: any) => {
    let error;
    if (!value) {
      error = "Please provide a value.";
    }
    return error;
  };

  const findDuplicates = (arr: any[]) => {
    let sorted_arr = arr.slice().sort();
    let results: any[] = [];
    for (let i = 0; i < sorted_arr.length - 1; i++) {
      if (sorted_arr[i + 1] == sorted_arr[i]) {
        results.push(sorted_arr[i]);
      }
    }
    return results;
  };

  const ConditionalWrapper = ({ condition, wrapper, children }: any) =>
    condition ? wrapper(children) : children;

  const answerBoxes = (
    props: FormikProps<{
      questionType: QuestionType;
      text: string;
      answerOptions: string[];
      correctAnswers: string[];
      subjects: string;
    }>
  ) => (
    <Stack spacing={4} mt={4}>
      <Box>
        <Text fontWeight="bold" color="grayMain" fontSize="md">
          Answer Options
        </Text>
        <Divider borderColor="grayLight" border="1px" mb={2} />
        <FieldArray
          name="answerOptions"
          render={(arrayHelpers) => (
            <>
              <Field
                name="correctAnswers"
                validate={(e: string[]) => {
                  if (e.length == 0) {
                    return props.values.questionType == QuestionType.Single
                      ? "Please select a correct answer."
                      : props.values.questionType == QuestionType.Multiple
                      ? "Please select at least one of the answers as correct."
                      : null;
                  }
                  return null;
                }}
              >
                {({ field: correctAnswersField, form }: any) => (
                  <Box>
                    <FormControl
                      isInvalid={
                        form.errors.correctAnswers &&
                        form.touched.correctAnswers
                      }
                    >
                      <FormErrorMessage>
                        {form.errors.correctAnswers}
                      </FormErrorMessage>
                    </FormControl>
                    {/* RadioGroup Wrapper for Multiple Choice */}
                    <ConditionalWrapper
                      condition={
                        props.values.questionType == QuestionType.Single
                      }
                      wrapper={(children: any) => (
                        <RadioGroup
                          {...correctAnswersField}
                          value={
                            correctAnswersField.value.length > 0
                              ? correctAnswersField.value[0]
                              : null
                          }
                          onChange={(e) => {
                            if (e) {
                              props.setFieldValue("correctAnswers", [e]);
                            }
                          }}
                        >
                          {children}
                        </RadioGroup>
                      )}
                    >
                      {/* CheckboxGroup Wrapper for Multiple Answer */}
                      <ConditionalWrapper
                        condition={
                          props.values.questionType == QuestionType.Multiple
                        }
                        wrapper={(children: any) => (
                          <CheckboxGroup
                            {...correctAnswersField}
                            value={correctAnswersField.value}
                            onChange={() => {}}
                          >
                            {children}
                          </CheckboxGroup>
                        )}
                      >
                        <Stack spacing={2} mb={2}>
                          {props.values.answerOptions.map((option, index) => (
                            <Box key={index}>
                              <Flex align="center">
                                {props.values.questionType ==
                                  QuestionType.Single && (
                                  <Radio
                                    value={option}
                                    colorScheme="gray"
                                    isChecked={
                                      !!option &&
                                      props.values.correctAnswers[0] === option
                                    }
                                  >
                                    <Text fontSize="md">Correct Answer</Text>
                                  </Radio>
                                )}
                                {props.values.questionType ==
                                  QuestionType.Multiple && (
                                  <>
                                    <Checkbox
                                      {...correctAnswersField}
                                      isChecked={
                                        !!option &&
                                        props.values.correctAnswers.includes(
                                          option
                                        )
                                      }
                                      colorScheme="gray"
                                      mr={2}
                                      value={option}
                                    />
                                    <Text fontSize="md" as="span">
                                      Correct Answer
                                    </Text>
                                  </>
                                )}
                              </Flex>
                              <Field
                                key={"answerOptions" + index}
                                name={`answerOptions.${index}`}
                                validate={(value: string) => {
                                  if (!value) {
                                    return "Please provide an answer.";
                                  } else {
                                    const duplicates = findDuplicates(
                                      props.values.answerOptions
                                    );
                                    if (duplicates.includes(value)) {
                                      return "Please change duplicate answer.";
                                    }
                                  }
                                  return null;
                                }}
                              >
                                {({ field: answerOptionsField }: any) => (
                                  <FormControl
                                    isInvalid={
                                      form.errors.answerOptions &&
                                      form.errors.answerOptions[index] &&
                                      form.touched.answerOptions &&
                                      form.touched.answerOptions[index]
                                    }
                                  >
                                    <Textarea
                                      {...answerOptionsField}
                                      border="2px"
                                      borderColor="grayLight"
                                      onChange={(e) => {
                                        /* When text box changes, remove the 
                                          answer from props if necessary */
                                        let answerOptions =
                                          props.values.answerOptions;
                                        const answerOptionBefore =
                                          answerOptions[index];
                                        answerOptions[index] = e.target.value;
                                        if (
                                          !answerOptions.includes(
                                            answerOptionBefore
                                          )
                                        ) {
                                          let correctAnswers = [
                                            ...props.values.correctAnswers,
                                          ];
                                          correctAnswers =
                                            correctAnswers.filter(
                                              (answer: string) =>
                                                answer !== answerOptionBefore
                                            );
                                          props.setFieldValue(
                                            "correctAnswers",
                                            correctAnswers
                                          );
                                        }
                                        props.handleChange(e);
                                      }}
                                    />
                                    <FormErrorMessage>
                                      {form.errors.answerOptions &&
                                        form.errors.answerOptions[index]}
                                    </FormErrorMessage>
                                  </FormControl>
                                )}
                              </Field>
                            </Box>
                          ))}
                        </Stack>
                      </ConditionalWrapper>
                    </ConditionalWrapper>
                  </Box>
                )}
              </Field>
              <HStack>
                <IconButton
                  aria-label="Add Answer Choice"
                  icon={<RiAddLine />}
                  size="xs"
                  fontSize="24px"
                  bg="green.400"
                  color="white"
                  onClick={() => {
                    arrayHelpers.push("");
                  }}
                />
                <IconButton
                  aria-label="Remove Answer Choice"
                  icon={<RiSubtractLine />}
                  size="xs"
                  fontSize="24px"
                  bg="red.400"
                  color="white"
                  onClick={() => {
                    const lastAnswer = props.values.answerOptions.at(-1);
                    if (
                      lastAnswer &&
                      props.values.correctAnswers.includes(lastAnswer)
                    ) {
                      let newCorrectAnswers = [...props.values.correctAnswers];
                      newCorrectAnswers = newCorrectAnswers.filter(
                        (answer) => answer !== lastAnswer
                      );
                      props.setFieldValue("correctAnswers", newCorrectAnswers);
                    }
                    arrayHelpers.pop();
                  }}
                />
              </HStack>
            </>
          )}
        />
      </Box>
    </Stack>
  );

  let subjectToColors: Record<string, string> = {};
  if (meData?.me?.subjectColors) {
    subjectToColors = JSON.parse(meData.me.subjectColors);
  }

  const createContentForm = (
    <Box
      border="2px"
      borderColor="grayLight"
      borderRadius="md"
      bg="White"
      p={4}
      mb={2}
    >
      <Text fontSize="md" mb={2}>
        In order to create content on Schoolyard, you must be invited. Please
        enter the invitation password below.
      </Text>
      <Formik
        initialValues={{
          password: "",
        }}
        onSubmit={async (values, { setErrors }) => {
          await setUserCanCreate({
            variables: values,
            update: (cache, { data: responseData }) => {
              if (!responseData?.setUserCanCreate) {
                setErrors({ password: "Incorrect Password" });
              } else {
                cache.writeFragment({
                  id: "User:" + meData?.me?.id,
                  fragment: gql`
                    fragment _ on User {
                      canCreate
                    }
                  `,
                  data: {
                    canCreate: true,
                  },
                });
              }
            },
          });
        }}
      >
        {({ isSubmitting }) => (
          <Box>
            <Form>
              <InputField
                name="password"
                label="Create Content Password"
                type="password"
              />
              <Button
                mt={4}
                type="submit"
                isLoading={isSubmitting}
                bg="iris"
                _hover={{
                  bg: "irisDark",
                }}
                color="white"
              >
                Submit Password
              </Button>
            </Form>
          </Box>
        )}
      </Formik>
    </Box>
  );
  return meData?.me ? (
    meData.me.canCreate ? (
      <Box>
        <Box
          border="2px"
          borderColor="grayLight"
          borderRadius="md"
          bg="White"
          p={4}
          mb={2}
        >
          <Grid templateColumns="repeat(3, 1fr)">
            <IconButton
              aria-label="Go Back"
              width="24px"
              minWidth="24px"
              height="24px"
              color="grayMain"
              isRound={true}
              size="lg"
              bg="none"
              _focus={{
                boxShadow: "none",
              }}
              _hover={{
                bg: "grayLight",
              }}
              icon={<ArrowBackIcon />}
              onClick={() => {
                router.back();
              }}
            />
            <Text
              fontSize="md"
              fontWeight="bold"
              textAlign="center"
              color="grayMain"
            >
              Create Content
            </Text>
          </Grid>
        </Box>
        {parentData?.sentence && (
          <Box
            border="2px"
            borderColor="grayLight"
            borderRadius="md"
            bg="White"
            p={4}
            my={2}
          >
            <Text fontWeight="bold" color="grayMain" fontSize="sm">
              Content Type
            </Text>
            <Divider borderColor="grayLight" border="1px" mb={2} />
            <RadioGroup
              size="lg"
              borderColor="grayMain"
              colorScheme="gray"
              value={contentType}
              onChange={setContentType}
            >
              <HStack spacing={4}>
                <Radio value="paragraph">
                  <Text fontSize="md">Paragraph</Text>
                </Radio>
                <Radio value="question">
                  <Text fontSize="md">Question</Text>
                </Radio>
              </HStack>
            </RadioGroup>
          </Box>
        )}
        {/* Create Sentence Form */}
        <Formik
          initialValues={{
            summarySentence: parentData?.sentence?.text,
            explanationSentences: ["", "", ""],
            subjects:
              parentData && parentData?.sentence
                ? parentData.sentence.subjects.join(", ")
                : "",
            checkIfSameAsParent: true,
          }}
          validateOnChange={false}
          validateOnBlur={false}
          enableReinitialize={true}
          onSubmit={async (values) => {
            const subjectsArray = values.subjects
              .split(",")
              .map((s: string) => s.trim());
            const response = await createParagraph({
              variables: {
                paragraphInput: {
                  text: values.summarySentence!.trim(),
                  childrenText: values.explanationSentences.map(
                    (sentence: string) => sentence.trim()
                  ),
                  subjects: subjectsArray,
                },
                cloningOriginId: parentData?.sentence?.id,
              },
              update: (cache) => {
                cache.evict({ fieldName: "sentences" });
              },
            });
            if (response.errors) {
              console.log("Create paragraph error response: ", response.errors);
            } else {
              router.push("/learn/" + response.data?.createParagraph.id);
            }
          }}
        >
          {(props) => (
            <Form>
              <Box display={contentType == "paragraph" ? "block" : "none"}>
                <Box
                  border="2px"
                  borderColor="grayLight"
                  borderRadius="md"
                  bg="White"
                  p={4}
                  my={2}
                >
                  <Stack spacing={4}>
                    {parentData?.sentence && (
                      <Box>
                        <Text fontWeight="bold" color="grayMain" fontSize="sm">
                          Sentence Being Linked
                        </Text>
                        <Divider borderColor="grayLight" border="1px" mb={2} />
                        <Text fontSize="lg">{parentData.sentence?.text}</Text>
                      </Box>
                    )}
                    <Box>
                      <Text fontWeight="bold" color="grayMain" fontSize="sm">
                        Summary Sentence
                      </Text>
                      <Divider borderColor="grayLight" border="1px" mb={2} />
                      {parentData?.sentence ? (
                        <Field
                          id="checkIfSameAsParent"
                          name="checkIfSameAsParent"
                          type="checkbox"
                        >
                          {({ field }: any) => (
                            <Checkbox
                              isChecked={props.values.checkIfSameAsParent}
                              {...field}
                              borderColor="grayMain"
                              colorScheme="gray"
                              onChange={(e) => {
                                props.setFieldValue(
                                  "checkIfSameAsParent",
                                  e.target.checked
                                );
                                if (e.target.checked) {
                                  props.setFieldValue(
                                    "summarySentence",
                                    parentData?.sentence?.text
                                  );
                                }
                              }}
                            >
                              <Text fontSize="sm">
                                {" "}
                                Keep original summary sentence
                              </Text>
                            </Checkbox>
                          )}
                        </Field>
                      ) : null}
                      <Field name="summarySentence" validate={checkIfEmpty}>
                        {({ field, form }: any) => (
                          <FormControl
                            isInvalid={
                              form.errors.summarySentence &&
                              form.touched.summarySentence
                            }
                          >
                            <Textarea
                              {...field}
                              border="2px"
                              borderColor="grayLight"
                              onChange={(e) => {
                                props.handleChange(e);
                                props.setFieldValue(
                                  "checkIfSameAsParent",
                                  false
                                );
                              }}
                            />
                            <FormErrorMessage>
                              {form.errors.summarySentence}
                            </FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" color="grayMain" fontSize="sm">
                        Explanation Sentences
                      </Text>
                      <Divider borderColor="grayLight" border="1px" mb={2} />
                      <FieldArray
                        name="explanationSentences"
                        render={(arrayHelpers) => (
                          <>
                            <Stack spacing={2} mb={2}>
                              {props.values.explanationSentences.map(
                                (_, index) => (
                                  <Field
                                    key={"explanation" + index}
                                    name={`explanationSentences.${index}`}
                                    validate={checkIfEmpty}
                                  >
                                    {({ field, form }: any) => (
                                      <FormControl
                                        isInvalid={
                                          form.errors.explanationSentences &&
                                          form.errors.explanationSentences[
                                            index
                                          ] &&
                                          form.touched.explanationSentences &&
                                          form.touched.explanationSentences[
                                            index
                                          ]
                                        }
                                      >
                                        <Textarea
                                          {...field}
                                          border="2px"
                                          borderColor="grayLight"
                                        />
                                        <FormErrorMessage>
                                          {form.errors.explanationSentences &&
                                            form.errors.explanationSentences[
                                              index
                                            ]}
                                        </FormErrorMessage>
                                      </FormControl>
                                    )}
                                  </Field>
                                )
                              )}
                            </Stack>
                            <HStack>
                              <IconButton
                                aria-label="Add Explanation Sentence"
                                icon={<RiAddLine />}
                                size="xs"
                                fontSize="24px"
                                bg="green.400"
                                color="white"
                                onClick={() => {
                                  arrayHelpers.push("");
                                }}
                              />
                              <IconButton
                                aria-label="Remove Explanation Sentence"
                                icon={<RiSubtractLine />}
                                size="xs"
                                fontSize="24px"
                                bg="red.400"
                                color="white"
                                onClick={() => {
                                  arrayHelpers.pop();
                                }}
                              />
                            </HStack>
                          </>
                        )}
                      />
                    </Box>
                    <Box>
                      <Text fontWeight="bold" color="grayMain" fontSize="sm">
                        Subjects
                      </Text>
                      <Divider borderColor="grayLight" border="1px" mb={2} />
                      <Field name="subjects" validate={checkIfEmpty}>
                        {({ field, form }: any) => (
                          <FormControl
                            isInvalid={
                              form.errors.subjects && form.touched.subjects
                            }
                          >
                            <Input
                              {...field}
                              size="sm"
                              border="2px"
                              borderColor="grayLight"
                            />
                            <FormErrorMessage>
                              {form.errors.subjects}
                            </FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      <Text fontSize="sm" color="grayMain">
                        Please input subjects separated by a comma.
                      </Text>
                    </Box>
                  </Stack>
                </Box>
                <Box
                  border="2px"
                  borderColor="grayLight"
                  borderRadius="md"
                  bg="White"
                  p={4}
                  my={2}
                >
                  <Text fontWeight="bold" color="grayMain" fontSize="sm">
                    Preview
                  </Text>
                  <Divider borderColor="grayLight" border="1px" mb={2} />
                  <Flex align="center">
                    {userData?.me?.photoUrl ? (
                      <Avatar
                        size="md"
                        bg="white"
                        name={
                          userData.me.firstName + " " + userData.me.lastName
                        }
                        src={`${userData.me.photoUrl}`}
                        mr={2}
                        color="white"
                      />
                    ) : (
                      <Avatar size="md" bg="iris" mr={2} />
                    )}
                    <Box>
                      <Text fontWeight="bold" fontSize="md">
                        {userData?.me?.firstName} {userData?.me?.lastName}
                      </Text>
                      <Flex wrap="wrap">
                        {props.values.subjects
                          ? props.values.subjects.split(",").map((subject) => {
                              subject = subject.trim().toLowerCase();
                              return subject ? (
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
                                  <Text fontSize="sm">
                                    {"#" + subject.toLowerCase()}
                                  </Text>
                                </Flex>
                              ) : null;
                            })
                          : null}
                      </Flex>
                    </Box>
                  </Flex>
                  <Text my={2} fontWeight="bold" fontSize="xl">
                    {props.values.summarySentence}
                  </Text>
                  <Text mb={4}>
                    {props.values.explanationSentences.join(" ")}
                  </Text>
                  <Divider borderColor="grayLight" border="1px" mb={2} />
                  <Text fontSize="sm" color="grayMain">
                    Final character count:{" "}
                    {(props.values.summarySentence
                      ? props.values.summarySentence.length
                      : 0) +
                      props.values.explanationSentences.join(" ").trim()
                        .length}{" "}
                    characters (800 max)
                  </Text>
                  {(props.values.summarySentence
                    ? props.values.summarySentence.length
                    : 0) +
                    props.values.explanationSentences.join(" ").trim().length >
                    800 && (
                    <Text color="red" fontSize="sm">
                      800 character limit exceeded
                    </Text>
                  )}
                  <Button
                    my={4}
                    color="white"
                    bg="mint"
                    type="submit"
                    isLoading={props.isSubmitting}
                    isDisabled={
                      (props.values.summarySentence
                        ? props.values.summarySentence.length
                        : 0) +
                        props.values.explanationSentences.join(" ").trim()
                          .length >
                      800
                    }
                  >
                    Create
                  </Button>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>

        {/* Create Question Form */}
        <Formik
          initialValues={{
            questionType: QuestionType.Single,
            text: "",
            answerOptions: ["", "", "", ""],
            correctAnswers: [] as string[],
            subjects:
              parentData && parentData?.sentence
                ? parentData.sentence.subjects.join(", ")
                : "",
          }}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values) => {
            const subjectsArray = values.subjects
              .split(",")
              .map((s: string) => s.trim());
            const response = await createQuestion({
              variables: {
                questionInput: {
                  sentenceId: parentData?.sentence?.id,
                  text: values.text,
                  subjects: subjectsArray,
                  questionType:
                    values.questionType == QuestionType.Single
                      ? QuestionType.Single
                      : values.questionType == QuestionType.Multiple
                      ? QuestionType.Multiple
                      : values.questionType == QuestionType.Text
                      ? QuestionType.Text
                      : null,
                  choices: values.answerOptions,
                  answer: values.correctAnswers,
                },
              },
              update: (cache) => {
                cache.evict({
                  id: "Sentence:" + parentData?.sentence?.id,
                });
              },
            });
            if (response.errors) {
              console.log("Create question error response: ", response.errors);
            } else {
              router.push("/learn/" + parentData?.sentence?.id);
            }
          }}
          enableReinitialize={true}
        >
          {(props) => (
            <Form>
              <Box display={contentType == "question" ? "block" : "none"}>
                <Box
                  border="2px"
                  borderColor="grayLight"
                  borderRadius="md"
                  bg="White"
                  p={4}
                  my={2}
                >
                  {parentData?.sentence && (
                    <Box>
                      <Text fontWeight="bold" color="grayMain" fontSize="sm">
                        Sentence Being Linked
                      </Text>
                      <Divider borderColor="grayLight" border="1px" mb={2} />
                      <Text fontSize="lg">{parentData.sentence?.text}</Text>
                    </Box>
                  )}
                  <Box mt={4}>
                    <Text fontWeight="bold" color="grayMain" fontSize="sm">
                      Question
                    </Text>
                    <Divider borderColor="grayLight" border="1px" mb={2} />
                    <Field name="text" validate={checkIfEmpty}>
                      {({ field, form }: any) => (
                        <FormControl
                          isInvalid={form.errors.text && form.touched.text}
                        >
                          <Textarea
                            {...field}
                            border="2px"
                            borderColor="grayLight"
                          />
                          <FormErrorMessage>
                            {form.errors.text}
                          </FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </Box>
                  <Box mt={4}>
                    <Text fontWeight="bold" color="grayMain" fontSize="sm">
                      Question Type
                    </Text>
                    <Divider borderColor="grayLight" border="1px" mb={2} />
                    <Field name="questionType" validate={checkIfEmpty}>
                      {({ field }: any) => (
                        <RadioGroup
                          {...field}
                          size="lg"
                          borderColor="grayMain"
                          colorScheme="gray"
                          onChange={(e) => {
                            props.setFieldValue("questionType", e);
                            props.setFieldValue("correctAnswers", []);
                          }}
                        >
                          <Flex wrap="wrap">
                            <Radio value={QuestionType.Single} mr={4} mb={2}>
                              <Text fontSize="md">Multiple Choice</Text>
                            </Radio>
                            <Radio value={QuestionType.Multiple} mr={4} mb={2}>
                              <Text fontSize="md">Multiple Answers</Text>
                            </Radio>
                            <Radio value={QuestionType.Text} mb={2}>
                              <Text fontSize="md">Written Answer</Text>
                            </Radio>
                          </Flex>
                        </RadioGroup>
                      )}
                    </Field>
                  </Box>
                  {(props.values.questionType == QuestionType.Single ||
                    props.values.questionType == QuestionType.Multiple) &&
                    answerBoxes(props)}
                  {props.values.questionType == QuestionType.Text && (
                    <Box>
                      <Text
                        fontWeight="bold"
                        color="grayMain"
                        mt={4}
                        fontSize="sm"
                      >
                        Answer
                      </Text>
                      <Divider borderColor="grayLight" border="1px" mb={2} />
                      <Field
                        name="correctAnswers"
                        validate={(value: string[]) =>
                          !value || value.length == 0 || !value[0]
                            ? "Please provide an answer."
                            : null
                        }
                      >
                        {({ field, form }: any) => (
                          <FormControl
                            isInvalid={
                              form.errors.correctAnswers &&
                              form.touched.correctAnswers
                            }
                          >
                            <Input
                              {...field}
                              border="2px"
                              borderColor="grayLight"
                              value={field[0]}
                              onChange={(e) =>
                                props.setFieldValue("correctAnswers", [
                                  e.target.value,
                                ])
                              }
                            />
                            <FormErrorMessage>
                              {form.errors.correctAnswers}
                            </FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                    </Box>
                  )}
                  <Box mt={4}>
                    <Text fontWeight="bold" color="grayMain" fontSize="sm">
                      Subjects
                    </Text>
                    <Divider borderColor="grayLight" border="1px" mb={2} />
                    <Field name="subjects" validate={checkIfEmpty}>
                      {({ field, form }: any) => (
                        <FormControl
                          isInvalid={
                            form.errors.subjects && form.touched.subjects
                          }
                        >
                          <Input
                            {...field}
                            size="sm"
                            border="2px"
                            borderColor="grayLight"
                          />
                          <FormErrorMessage>
                            {form.errors.subjects}
                          </FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                    <Text fontSize="sm" color="grayMain">
                      Please input subjects separated by a comma.
                    </Text>
                  </Box>
                </Box>
                <Box
                  border="2px"
                  borderColor="grayLight"
                  borderRadius="md"
                  bg="White"
                  p={4}
                  my={2}
                >
                  <Text fontWeight="bold" color="grayMain" fontSize="sm">
                    Preview
                  </Text>
                  <Divider borderColor="grayLight" border="1px" mb={2} />
                  <Flex align="center">
                    {userData?.me?.photoUrl ? (
                      <Avatar
                        size="md"
                        bg="white"
                        name={
                          userData.me.firstName + " " + userData.me.lastName
                        }
                        src={`${userData.me.photoUrl}`}
                        mr={2}
                        color="white"
                      />
                    ) : (
                      <Avatar size="md" bg="iris" mr={2} />
                    )}
                    <Box>
                      <Text fontWeight="bold" fontSize="md">
                        {userData?.me?.firstName} {userData?.me?.lastName}
                      </Text>
                      <Flex wrap="wrap">
                        {props.values.subjects
                          ? props.values.subjects.split(",").map((subject) => {
                              subject = subject.trim().toLowerCase();
                              return subject ? (
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
                                  <Text fontSize="sm">
                                    {"#" + subject.toLowerCase()}
                                  </Text>
                                </Flex>
                              ) : null;
                            })
                          : null}
                      </Flex>
                    </Box>
                  </Flex>
                  <Text my={2} fontWeight="bold" fontSize="xl">
                    {props.values.text}
                  </Text>
                  <Text color="grayMain" fontSize="sm" mb={2}>
                    {props.values.questionType == QuestionType.Single &&
                      "Select the correct answer"}
                    {props.values.questionType == QuestionType.Multiple &&
                      "Select all that apply"}
                    {props.values.questionType == QuestionType.Text &&
                      "Type the correct answer"}
                  </Text>
                  {(props.values.questionType == QuestionType.Single ||
                    props.values.questionType == QuestionType.Multiple) && (
                    <Stack>
                      {props.values.answerOptions.map((option, index) => (
                        <Box key={index}>
                          {props.values.questionType == QuestionType.Single && (
                            <Radio
                              size="lg"
                              my="4px"
                              borderColor="grayMain"
                              colorScheme="gray"
                              isChecked={props.values.correctAnswers.includes(
                                option
                              )}
                            >
                              <Text fontSize="md">{option}</Text>
                            </Radio>
                          )}

                          {props.values.questionType ==
                            QuestionType.Multiple && (
                            <Checkbox
                              size="lg"
                              my="4px"
                              borderColor="grayMain"
                              colorScheme="gray"
                              isChecked={props.values.correctAnswers.includes(
                                option
                              )}
                            >
                              <Text ml={2} fontSize="md">
                                {option}
                              </Text>
                            </Checkbox>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  )}
                  {props.values.questionType == QuestionType.Text && (
                    <Input
                      size="sm"
                      border="2px"
                      borderColor="grayLight"
                      value={
                        props.values.correctAnswers[0]
                          ? props.values.correctAnswers[0]
                          : ""
                      }
                      readOnly={true}
                    />
                  )}
                  <Divider borderColor="grayLight" border="1px" mt={4} mb={2} />
                  <Button
                    my="4px"
                    color="white"
                    bg="mint"
                    type="submit"
                    isLoading={props.isSubmitting}
                  >
                    Create
                  </Button>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    ) : (
      <>{createContentForm}</>
    )
  ) : (
    <></>
  );
};

export default withApollo({ ssr: false })(Create);
