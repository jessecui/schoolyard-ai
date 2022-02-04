import { gql } from "@apollo/client";
import { ArrowBackIcon } from "@chakra-ui/icons";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Avatar,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Circle,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  Grid,
  HStack,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Textarea
} from "@chakra-ui/react";
import { Field, FieldArray, Form, Formik, FormikProps } from "formik";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { RiAddLine, RiSubtractLine } from "react-icons/ri";
import {
  QuestionType,
  useDeleteQuestionMutation,
  useMeQuery,
  useQuestionQuery,
  useUpdateQuestionMutation
} from "../../../graphql/generated/graphql";
import { withApollo } from "../../../utils/withApollo";

export const EditQuestion: React.FC<{}> = ({}) => {
  const router = useRouter();

  const { data: meData, loading: meLoading } = useMeQuery();
  useEffect(() => {
    if (
      !meLoading &&
      (!meData?.me ||
        (questionData?.question?.creatorId &&
          meData.me.id != questionData?.question?.creatorId))
    ) {
      router.push("/");
    }
  });

  const { data: questionData, loading: questionLoading } = useQuestionQuery({
    variables: { id: Number(router.query.id) ? Number(router.query.id) : -1 },
  });

  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();

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
        <Text fontWeight="bold" color="grayMain" fontSize="sm">
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
                                        (
                                          props.values
                                            .correctAnswers as string[]
                                        ).includes(option)
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
                      (props.values.correctAnswers as string[]).includes(
                        lastAnswer
                      )
                    ) {
                      let newCorrectAnswers = [...props.values.correctAnswers];
                      newCorrectAnswers = newCorrectAnswers.filter(
                        (answer) => answer !== lastAnswer
                      );
                      props.setFieldValue(
                        "correctAnswers",
                        newCorrectAnswers as string[]
                      );
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

  // Delete button
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  const deleteRef = useRef();

  let subjectToColors: Record<string, string> = {};
  if (meData?.me?.subjectColors) {
    subjectToColors = JSON.parse(meData.me.subjectColors);
  }

  return questionData?.question ? (
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
            onClick={() => router.back()}
          />
          <Text
            fontSize="md"
            fontWeight="bold"
            textAlign="center"
            color="grayMain"
          >
            Update Question
          </Text>
        </Grid>
      </Box>
      <Formik
        initialValues={{
          questionType: questionData.question.questionType,
          text: questionData.question.text,
          answerOptions: questionData.question.choices
            ? questionData.question.choices
            : ["", "", "", ""],
          correctAnswers: questionData.question.answer,
          subjects:
            questionData && questionData?.question
              ? questionData.question.subjects.join(", ")
              : "",
        }}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={async (values) => {
          const subjectsArray = values.subjects
            .split(",")
            .map((s: string) => s.trim());
          const response = await updateQuestion({
            variables: {
              id: parseInt(router.query.id as string),
              questionInput: {
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
          });
          if (response.errors) {
            console.log("Create question error response: ", response.errors);
          } else {
            router.push("/");
          }
        }}
        enableReinitialize={true}
      >
        {(props) => (
          <Form>
            <Box
              border="2px"
              borderColor="grayLight"
              borderRadius="md"
              bg="White"
              p={4}
              my={2}
            >
              {questionData?.question?.sentence?.text && (
                <Box mb={4}>
                  <Text fontWeight="bold" color="grayMain" fontSize="sm">
                    Sentence Being Linked
                  </Text>
                  <Divider borderColor="grayLight" border="1px" mb={2} />
                  <Text fontSize="lg">
                    {questionData.question?.sentence.text}
                  </Text>
                </Box>
              )}
              <Box>
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
                  <Text fontWeight="bold" color="grayMain" mt={4} fontSize="sm">
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
                          value={field.value[0]}
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
                      isInvalid={form.errors.subjects && form.touched.subjects}
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
                {meData?.me?.photoUrl ? (
                  <Avatar
                    size="md"
                    bg="white"
                    name={meData.me.firstName + " " + meData.me.lastName}
                    src={`${meData.me.photoUrl}`}
                    mr={2}
                    color="white"
                  />
                ) : (
                  <Avatar size="md" bg="iris" mr={2} />
                )}
                <Box>
                  <Text fontWeight="bold" fontSize="md">
                    {meData?.me?.firstName} {meData?.me?.lastName}
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
                          isChecked={(
                            props.values.correctAnswers as string[]
                          ).includes(option)}
                        >
                          <Text fontSize="md">{option}</Text>
                        </Radio>
                      )}

                      {props.values.questionType == QuestionType.Multiple && (
                        <Checkbox
                          size="lg"
                          my="4px"
                          borderColor="grayMain"
                          colorScheme="gray"
                          isChecked={(
                            props.values.correctAnswers as string[]
                          ).includes(option)}
                        >
                          <Text ml={2} fontSize="lg">
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
              <HStack>
                <Button
                  my="4px"
                  color="white"
                  bg="mint"
                  type="submit"
                  isLoading={props.isSubmitting}
                >
                  Update
                </Button>
                <Box>
                  <Button
                    size="sm"
                    bg="none"
                    color="red"
                    _hover={{
                      bg: "none",
                      color: "red.800",
                      textDecorationLine: "underline",
                    }}
                    onClick={() => setIsOpen(true)}
                    _focus={{
                      boxShadow: "none",
                    }}
                  >
                    Delete
                  </Button>

                  <AlertDialog
                    isOpen={isOpen}
                    leastDestructiveRef={deleteRef.current}
                    onClose={onClose}
                  >
                    <AlertDialogOverlay>
                      <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                          Delete
                        </AlertDialogHeader>
                        <AlertDialogBody>
                          Are you sure? You cannot undo this action afterwards.
                          <AlertDialogFooter>
                            <Button
                              color="white"
                              bg="mint"
                              ref={deleteRef.current}
                              onClick={onClose}
                            >
                              Cancel
                            </Button>
                            <Button
                              colorScheme="red"
                              onClick={() => {
                                if (questionData.question) {
                                  deleteQuestion({
                                    variables: {
                                      id: questionData.question.id,
                                    },
                                    update: (cache) => {
                                      cache.evict({
                                        id:
                                          "Question:" +
                                          questionData.question?.id,
                                      });
                                      let updatedQuestionReviews =
                                        meData!.me!.questionReviews.filter(
                                          (review) =>
                                            review.questionId !=
                                            Number(router.query.id)
                                        );
                                      cache.writeFragment({
                                        id: "User:" + meData?.me?.id,
                                        fragment: gql`
                                          fragment _ on User {
                                            questionReviews
                                          }
                                        `,
                                        data: {
                                          questionReviews:
                                            updatedQuestionReviews,
                                        },
                                      });
                                    },
                                  });
                                }
                                router.push("/review?deleteSuccess=true");
                              }}
                              ml={3}
                            >
                              Delete
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogBody>
                      </AlertDialogContent>
                    </AlertDialogOverlay>
                  </AlertDialog>
                </Box>
              </HStack>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  ) : null;
};

export default withApollo({ ssr: false })(EditQuestion);
