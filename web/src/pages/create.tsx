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
  RadioGroup, Text,
  Textarea
} from "@chakra-ui/react";
import { Field, FieldArray, Form, Formik } from "formik";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { IoPersonCircle } from "react-icons/io5";
import {
  RiAddLine, RiSubtractLine
} from "react-icons/ri";
import {
  MeQuery,
  useCreateParagraphMutation,
  useMeQuery,
  useSentenceQuery
} from "../generated/graphql";
import { withApollo } from "../utils/withApollo";

export const Create: React.FC<{}> = ({}) => {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useMeQuery();
  const [userData, setUserData] = useState<MeQuery | undefined>();
  const [userDataLoading, setUserDataLoading] = useState<Boolean | undefined>();
  useEffect(() => {
    if (!meLoading && !meData?.me) {
      router.push("/");
    }
    setUserData(meData);
    setUserDataLoading(meLoading);
  });
  const { data: parentData, loading } = useSentenceQuery({
    variables: {
      id: Number(router.query.parent) ? Number(router.query.parent) : -1,
    },
  });

  const [createParagraph] = useCreateParagraphMutation();
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
          defaultValue="learning"
        >
          <HStack spacing={4}>
            <Radio value="learning">
              <Text fontSize="md">Learning</Text>
            </Radio>
            <Radio value="question">
              <Text fontSize="md">Question</Text>
            </Radio>
          </HStack>
        </RadioGroup>
      </Box>
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
        onSubmit={async (values: any) => {
          const subjectsArray = values.subjects
            .split(",")
            .map((s: string) => s.trim());
          const response = await createParagraph({
            variables: {
              paragraphInput: {
                text: values.summarySentence.trim(),
                childrenText: values.explanationSentences.map(
                  (sentence: string) => sentence.trim()
                ),
                subjects: subjectsArray,                
              },
              cloningOriginId: parentData?.sentence?.id,
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
            <Box>
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
                        validate={true}
                      >
                        {({ field }: any) => (
                          <Checkbox
                            isChecked={props.values.checkIfSameAsParent}
                            {...field}
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
                              aria-label="Add Explanation Sentence"
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
    </Box>
  );
};

export default withApollo({ ssr: false })(Create);
