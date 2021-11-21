import { Box, Circle, Divider, Flex, HStack, Stack } from "@chakra-ui/layout";
import {
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  Icon,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Field, FieldArray, Form, Formik } from "formik";
import { formatWithValidation } from "next/dist/shared/lib/utils";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { IoPersonCircle } from "react-icons/io5";
import { RiAddLine, RiSubtractLine } from "react-icons/ri";
import {
  MeQuery,
  QuestionType,
  useCreateParagraphMutation,
  useCreateQuestionMutation,
  useMeQuery,
  useSentenceQuery,
} from "../generated/graphql";
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
  const [contentType, setContentType] = useState("paragraph");

  useEffect(() => {
    if (!meLoading && !meData?.me) {
      router.push("/");
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

  return (
    <Box>
      <Box
        border="2px"
        borderColor="grayLight"
        borderRadius="md"
        bg="White"
        p={4}
        my={2}
      >
        <Text
          fontSize="g"
          fontWeight="bold"
          textAlign="center"
          color="grayMain"
        >
          Create Content Form
        </Text>
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
          <Text fontWeight="bold" color="grayMain">
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
        enableReinitialize={true}
        onSubmit={async (values) => {
          console.log("values: ", values);
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
                      <Text fontWeight="bold" color="grayMain">
                        Sentence Being Linked
                      </Text>
                      <Divider borderColor="grayLight" border="1px" mb={2} />
                      <Text>{parentData.sentence?.text}</Text>
                    </Box>
                  )}
                  <Box>
                    <Text fontWeight="bold" color="grayMain">
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
                              props.setFieldValue("checkIfSameAsParent", false);
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
                    <Text fontWeight="bold" color="grayMain">
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
                                        form.touched.explanationSentences[index]
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
                    <Text fontWeight="bold" color="grayMain">
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
                <Text fontWeight="bold" color="grayMain">
                  Preview
                </Text>
                <Divider borderColor="grayLight" border="1px" mb={2} />
                <Flex align="center">
                  <Icon as={IoPersonCircle} color="iris" w={12} h={12} mr={2} />
                  <Box>
                    <Text fontWeight="bold" fontSize="lg">
                      {userData?.me?.firstName} {userData?.me?.lastName}
                    </Text>
                    <HStack spacing="6px">
                      {props.values.subjects
                        ? props.values.subjects.split(",").map((subject) => {
                            subject = subject.trim();
                            return subject ? (
                              <Flex align="center" key={subject}>
                                <Circle mr="4px" size={4} bg="grayMain" />
                                <Text size="sm">
                                  {"#" + subject.toLowerCase()}
                                </Text>
                              </Flex>
                            ) : null;
                          })
                        : null}
                    </HStack>
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
          questionType: "multipleChoice",
          question: "",
          answerOptions: ["", "", "", ""],
          correctAnswerIndex: "", // For single multiple choice
          correctAnswerIndices: [], // For multiple answers
          correctAnswer: "", // For written answer
          subjects:
            parentData && parentData?.sentence
              ? parentData.sentence.subjects.join(", ")
              : "",
        }}
        onSubmit={async (values) => {
          const subjectsArray = values.subjects
            .split(",")
            .map((s: string) => s.trim());
          const response = await createQuestion({
            variables: {
              questionInput: {
                sentenceId: parentData?.sentence?.id,
                question: values.question,
                subjects: subjectsArray,
                questionType:
                  values.questionType == "multipleChoice"
                    ? QuestionType.Single
                    : values.questionType == "multipleAnswers"
                    ? QuestionType.Multiple
                    : values.questionType == "writtenAnswer"
                    ? QuestionType.Text
                    : null,
                choices: values.answerOptions,
                answer:
                  values.questionType == "multipleChoice"
                    ? [
                        values.answerOptions[
                          parseInt(values.correctAnswerIndex)
                        ],
                      ]
                    : values.questionType == "multipleAnswers"
                    ? values.correctAnswerIndices.map(
                        (index) => values.answerOptions[parseInt(index)]
                      )
                    : values.questionType == "writtenAnswer"
                    ? ["TODO"]
                    : null,
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
                    <Text fontWeight="bold" color="grayMain">
                      Sentence Being Linked
                    </Text>
                    <Divider borderColor="grayLight" border="1px" mb={2} />
                    <Text>{parentData.sentence?.text}</Text>
                  </Box>
                )}
                <Box mt={4}>
                  <Text fontWeight="bold" color="grayMain">
                    Question
                  </Text>
                  <Divider borderColor="grayLight" border="1px" mb={2} />
                  <Field name="question" validate={checkIfEmpty}>
                    {({ field, form }: any) => (
                      <FormControl
                        isInvalid={
                          form.errors.question && form.touched.question
                        }
                      >
                        <Textarea
                          {...field}
                          border="2px"
                          borderColor="grayLight"
                        />
                        <FormErrorMessage>
                          {form.errors.question}
                        </FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </Box>
                <Box mt={4}>
                  <Text fontWeight="bold" color="grayMain">
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
                        onChange={(e) => props.setFieldValue("questionType", e)}
                      >
                        <HStack spacing={4}>
                          <Radio value="multipleChoice">
                            <Text fontSize="md">Multiple Choice</Text>
                          </Radio>
                          <Radio value="multipleAnswers">
                            <Text fontSize="md">Multiple Answers</Text>
                          </Radio>
                          <Radio value="writtenAnswer">
                            <Text fontSize="md">Written Answer</Text>
                          </Radio>
                        </HStack>
                      </RadioGroup>
                    )}
                  </Field>
                </Box>
                {props.values.questionType == "multipleChoice" && (
                  <Stack spacing={4} mt={4}>
                    <Box>
                      <Text fontWeight="bold" color="grayMain">
                        Answer Options
                      </Text>
                      <Divider borderColor="grayLight" border="1px" mb={2} />
                      <FormControl
                        isInvalid={
                          !!props.errors.correctAnswerIndex &&
                          props.touched.correctAnswerIndex
                        }
                      >
                        <FormErrorMessage>
                          Please select a correct answer.
                        </FormErrorMessage>
                      </FormControl>
                      <FieldArray
                        name="answerOptions"
                        render={(arrayHelpers) => (
                          <>
                            <Field
                              name="correctAnswerIndex"
                              validate={checkIfEmpty}
                            >
                              {({
                                field: correctAnswerIndexField,
                                form,
                              }: any) => (
                                <Box>
                                  <RadioGroup
                                    {...correctAnswerIndexField}
                                    onChange={(e) =>
                                      props.setFieldValue(
                                        "correctAnswerIndex",
                                        e
                                      )
                                    }
                                  >
                                    <Stack spacing={2} mb={2}>
                                      {props.values.answerOptions.map(
                                        (_, index) => (
                                          <Box key={index}>
                                            <Radio
                                              value={index.toString()}
                                              width={"100%"}
                                              colorScheme="gray"
                                            >
                                              <Text fontSize="md">
                                                Correct Answer
                                              </Text>
                                            </Radio>
                                            <Field
                                              key={"explanation" + index}
                                              name={`answerOptions.${index}`}
                                              validate={checkIfEmpty}
                                            >
                                              {({ field }: any) => (
                                                <FormControl
                                                  isInvalid={
                                                    form.errors.answerOptions &&
                                                    form.errors.answerOptions[
                                                      index
                                                    ] &&
                                                    form.touched
                                                      .answerOptions &&
                                                    form.touched.answerOptions[
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
                                                    {form.errors
                                                      .answerOptions &&
                                                      form.errors.answerOptions[
                                                        index
                                                      ]}
                                                  </FormErrorMessage>
                                                </FormControl>
                                              )}
                                            </Field>
                                          </Box>
                                        )
                                      )}
                                    </Stack>
                                  </RadioGroup>
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
                                  if (
                                    (
                                      props.values.answerOptions.length - 1
                                    ).toString() ==
                                    props.values.correctAnswerIndex
                                  ) {
                                    props.setFieldValue(
                                      "correctAnswerIndex",
                                      ""
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
                )}
                {props.values.questionType == "multipleAnswers" && (
                  <Stack spacing={4} mt={4}>
                    <Box>
                      <Text fontWeight="bold" color="grayMain">
                        Answer Options
                      </Text>
                      <Divider borderColor="grayLight" border="1px" mb={2} />
                      <FieldArray
                        name="answerOptions"
                        render={(arrayHelpers) => (
                          <>
                            <Field
                              name="correctAnswerIndices"
                              validate={(e: string[]) =>
                                !e || e.length == 0
                                  ? "Please select at least one of the answers as a correct answer."
                                  : null
                              }
                            >
                              {({
                                field: correctAnswerIndiciesField,
                                form,
                              }: any) => (
                                <Box>
                                  <FormControl
                                    isInvalid={
                                      form.errors.correctAnswerIndices &&
                                      form.touched.correctAnswerIndices
                                    }
                                  >
                                    <FormErrorMessage>
                                      {form.errors.correctAnswerIndices}
                                    </FormErrorMessage>
                                  </FormControl>
                                  <Stack spacing={2} mb={2}>
                                    {props.values.answerOptions.map(
                                      (_, index) => (
                                        <Box key={index}>
                                          <Flex align="center">
                                            <Checkbox
                                              {...correctAnswerIndiciesField}
                                              isChecked={(
                                                props.values
                                                  .correctAnswerIndices as string[]
                                              ).includes(index.toString())}
                                              colorScheme="gray"
                                              mr={2}
                                              value={index.toString()}
                                            />
                                            <Text fontSize="md" as="span">
                                              Correct Answer
                                            </Text>
                                          </Flex>
                                          <Field
                                            key={"explanation" + index}
                                            name={`answerOptions.${index}`}
                                            validate={checkIfEmpty}
                                          >
                                            {({ field }: any) => (
                                              <FormControl
                                                isInvalid={
                                                  form.errors.answerOptions &&
                                                  form.errors.answerOptions[
                                                    index
                                                  ] &&
                                                  form.touched.answerOptions &&
                                                  form.touched.answerOptions[
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
                                                  {form.errors.answerOptions &&
                                                    form.errors.answerOptions[
                                                      index
                                                    ]}
                                                </FormErrorMessage>
                                              </FormControl>
                                            )}
                                          </Field>
                                        </Box>
                                      )
                                    )}
                                  </Stack>
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
                                  console.log(
                                    props.values.correctAnswerIndices
                                  );
                                  if (
                                    (
                                      props.values
                                        .correctAnswerIndices as string[]
                                    ).includes(
                                      (
                                        props.values.answerOptions.length - 1
                                      ).toString()
                                    )
                                  ) {
                                    let newCorrectAnswerIndicies = [
                                      ...props.values.correctAnswerIndices,
                                    ];
                                    newCorrectAnswerIndicies =
                                      newCorrectAnswerIndicies.filter(
                                        (i) =>
                                          i !==
                                          (
                                            props.values.answerOptions.length -
                                            1
                                          ).toString()
                                      );
                                    props.setFieldValue(
                                      "correctAnswerIndices",
                                      newCorrectAnswerIndicies as string[]
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
                )}
                {props.values.questionType == "writtenAnswer" && (
                  <Text>Written Answer</Text>
                )}
                <Box mt={4}>
                  <Text fontWeight="bold" color="grayMain">
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
                <Text fontWeight="bold" color="grayMain">
                  Preview
                </Text>
                <Divider borderColor="grayLight" border="1px" mb={2} />
                <Flex align="center">
                  <Icon as={IoPersonCircle} color="iris" w={12} h={12} mr={2} />
                  <Box>
                    <Text fontWeight="bold" fontSize="lg">
                      {userData?.me?.firstName} {userData?.me?.lastName}
                    </Text>
                    <HStack spacing="6px">
                      {props.values.subjects
                        ? props.values.subjects.split(",").map((subject) => {
                            subject = subject.trim();
                            return subject ? (
                              <Flex align="center" key={subject}>
                                <Circle mr="4px" size={4} bg="grayMain" />
                                <Text size="sm">
                                  {"#" + subject.toLowerCase()}
                                </Text>
                              </Flex>
                            ) : null;
                          })
                        : null}
                    </HStack>
                  </Box>
                </Flex>
                <Text my={2} fontWeight="bold" fontSize="xl">
                  {props.values.question}
                </Text>
                <Text color="grayMain" fontSize="sm" mb={2}>
                  Select all that apply
                </Text>
                <Stack>
                  {props.values.answerOptions.map((option, index) => (
                    <Checkbox
                      size="lg"
                      borderColor="grayMain"
                      colorScheme="gray"
                      key={index}
                      isChecked={(
                        props.values.correctAnswerIndices as string[]
                      ).includes(index.toString())}
                    >
                      <Text ml={2} fontSize="16px">
                        {option}
                      </Text>
                    </Checkbox>
                  ))}
                </Stack>
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
  );
};

export default withApollo({ ssr: false })(Create);
