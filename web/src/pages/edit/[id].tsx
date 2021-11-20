import { Box, Circle, Divider, Flex, HStack, Stack } from "@chakra-ui/layout";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  Icon,
  Input,
  Radio,
  RadioGroup,
  Select,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Field, FieldArray, Form, Formik } from "formik";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { IoPeople, IoPersonCircle } from "react-icons/io5";
import {
  RiCalendarEventFill,
  RiThumbDownLine,
  RiThumbUpLine,
} from "react-icons/ri";
import {
  MeQuery,
  Sentence,
  useDeleteParagraphMutation,
  useMeQuery,
  useSentenceQuery,
  useUpdateParagraphMutation,
} from "../../generated/graphql";
import { withApollo } from "../../utils/withApollo";

export const Edit: React.FC<{}> = ({}) => {
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

  const [updateParagraph] = useUpdateParagraphMutation();
  const [deleteParagraph] = useDeleteParagraphMutation();

  const { data: sentenceData, loading: sentenceLoading } = useSentenceQuery({
    variables: { id: Number(router.query.id) ? Number(router.query.id) : -1 },
  });

  const checkIfEmpty = (value: any) => {
    let error;
    if (!value) {
      error = "Please provide a value.";
    }
    return error;
  };

  const getSentenceParent = (sentence: Sentence) => {
    if (!sentence) {
      return null;
    }

    let sentenceClonesWithChildrenAndOrder = sentence.clones
      ? sentence.clones.filter(
          (clone: Sentence) =>
            clone.children && clone.id != sentence.id && clone.orderNumber
        )
      : null;

    return sentence.parent
      ? sentence.parent
      : sentenceClonesWithChildrenAndOrder &&
        sentenceClonesWithChildrenAndOrder.length > 0
      ? sentenceClonesWithChildrenAndOrder[0].parent
      : null;
  };

  const getSentenceOrderNumber = (sentence: any) => {
    if (!sentence) {
      return null;
    }
    let sentenceClonesWithChildrenAndOrder = sentence.clones
      ? sentence.clones.filter(
          (clone: Sentence) =>
            clone.children && clone.id != sentence.id && clone.orderNumber
        )
      : null;
    let returnVal = sentence.parent
      ? sentence.orderNumber
      : sentenceClonesWithChildrenAndOrder &&
        sentenceClonesWithChildrenAndOrder.length > 0
      ? sentenceClonesWithChildrenAndOrder[0].orderNumber
      : null;
    return returnVal;
  };

  // Delete button
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  const cancelRef = useRef();

  return sentenceData?.sentence ? (
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
          Update Content Form
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
          summarySentence: sentenceData.sentence.text,
          explanationSentences: sentenceData.sentence.children?.map(
            (child) => child.text
          ),
          subjects: sentenceData.sentence.subjects.join(","),
          checkIfSameAsParent:
            getSentenceParent(sentenceData.sentence as Sentence) &&
            sentenceData.sentence.text ==
              getSentenceParent(sentenceData.sentence as Sentence)!.children![
                getSentenceOrderNumber(sentenceData.sentence) as number
              ].text,
        }}
        enableReinitialize={true}
        onSubmit={async (values: any) => {
          const subjectsArray = values.subjects.split(",");
          subjectsArray.forEach((s: string) => s.trim);
          const response = await updateParagraph({
            variables: {
              id: Number(router.query.id),
              paragraphInput: {
                text: values.summarySentence.trim(),
                childrenText: values.explanationSentences.map(
                  (sentence: string) => sentence.trim()
                ),
                subjects: subjectsArray,
              },
            },
          });
          if (response.errors) {
            console.log("Update paragraph error response: ", response.errors);
          } else {
            router.push("/learn/" + response.data?.updateParagraph?.id);
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
                  {getSentenceParent(sentenceData.sentence as Sentence) &&
                    sentenceData.sentence?.children && (
                      <Box>
                        <Text fontWeight="bold" color="grayMain">
                          Sentence Being Linked
                        </Text>
                        <Divider borderColor="grayLight" border="1px" mb={2} />
                        <Text>
                          {
                            getSentenceParent(
                              sentenceData.sentence as Sentence
                            )!.children![
                              getSentenceOrderNumber(
                                sentenceData.sentence
                              ) as number
                            ].text
                          }
                        </Text>
                      </Box>
                    )}
                  <Box>
                    <Text fontWeight="bold" color="grayMain">
                      Summary Sentence
                    </Text>
                    <Divider borderColor="grayLight" border="1px" mb={2} />
                    {getSentenceParent(sentenceData.sentence as Sentence) &&
                      sentenceData.sentence?.children && (
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
                                    sentenceData.sentence?.text
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
                      )}
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
                  {props.values.explanationSentences &&
                    props.values.explanationSentences.length > 0 && (
                      <Box>
                        <Text fontWeight="bold" color="grayMain">
                          Explanation Sentences
                        </Text>
                        <Divider borderColor="grayLight" border="1px" mb={2} />
                        <Text color="grayMain">
                          Make sure to not change the meaning of the explanation
                          sentences if they have their own explanation
                          sentences.
                        </Text>

                        <FieldArray
                          name="explanationSentences"
                          render={() => (
                            <>
                              <Stack spacing={2} mb={2}>
                                {props.values.explanationSentences &&
                                  props.values.explanationSentences.map(
                                    (_, index) => (
                                      <Field
                                        key={"explanation" + index}
                                        name={`explanationSentences.${index}`}
                                        validate={checkIfEmpty}
                                      >
                                        {({ field, form }: any) => (
                                          <FormControl
                                            isInvalid={
                                              form.errors
                                                .explanationSentences &&
                                              form.errors.explanationSentences[
                                                index
                                              ] &&
                                              form.touched
                                                .explanationSentences &&
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
                                              {form.errors
                                                .explanationSentences &&
                                                form.errors
                                                  .explanationSentences[index]}
                                            </FormErrorMessage>
                                          </FormControl>
                                        )}
                                      </Field>
                                    )
                                  )}
                              </Stack>
                            </>
                          )}
                        />
                      </Box>
                    )}
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
                  {props.values.explanationSentences &&
                    props.values.explanationSentences.join(" ")}
                </Text>
                <Divider borderColor="grayLight" border="1px" mb={2} />
                <Text fontSize="sm" color="grayMain">
                  Final character count:{" "}
                  {props.values.summarySentence.length +
                    (props.values.explanationSentences
                      ? props.values.explanationSentences.join(" ").trim()
                          .length
                      : 0)}{" "}
                  characters (800 max)
                </Text>
                {props.values.summarySentence.length +
                  (props.values.explanationSentences
                    ? props.values.explanationSentences.join(" ").trim().length
                    : 0) >
                  800 && (
                  <Text color="red" fontSize="sm">
                    800 character limit exceeded
                  </Text>
                )}
                <HStack>
                  <Button
                    my={4}
                    color="white"
                    bg="mint"
                    type="submit"
                    isLoading={props.isSubmitting}
                    isDisabled={
                      props.values.summarySentence.length +
                        (props.values.explanationSentences
                          ? props.values.explanationSentences.join(" ").trim()
                              .length
                          : 0) >
                      800
                    }
                  >
                    Update
                  </Button>
                  <Button
                    size="sm"
                    bg="none"
                    color="grayMain"
                    _hover={{
                      bg: "none",
                      color: "gray.800",
                      textDecorationLine: "underline",
                    }}
                    onClick={() =>
                      router.push("/learn/" + sentenceData.sentence?.id)
                    }
                    _focus={{
                      boxShadow: "none",
                    }}
                  >
                    Cancel
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
                      leastDestructiveRef={cancelRef.current}
                      onClose={onClose}
                    >
                      <AlertDialogOverlay>
                        <AlertDialogContent>
                          <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete
                          </AlertDialogHeader>

                          {!sentenceData.sentence?.parent?.id ? (
                            <AlertDialogBody>
                              Are you sure? You cannot undo this action
                              afterwards.
                              <Text fontWeight="bold">
                                Other explanation sentences may lose their
                                summary sentence if their summary sentence is
                                one of the sentences you are deleting.
                              </Text>
                              <AlertDialogFooter>
                                <Button
                                  color="white"
                                  bg="mint"
                                  ref={cancelRef.current}
                                  onClick={onClose}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  colorScheme="red"
                                  onClick={() => {
                                    if (sentenceData.sentence) {
                                      deleteParagraph({
                                        variables: {
                                          id: sentenceData.sentence.id,
                                        },
                                      });
                                    }
                                    router.push("/");
                                  }}
                                  ml={3}
                                >
                                  Delete
                                </Button>
                              </AlertDialogFooter>
                            </AlertDialogBody>
                          ) : (
                            <AlertDialogBody>
                              This sentence is part of a paragraph and can only
                              be deleted by deleting the entire paragraph.
                              <Box mt={2}>
                                <Button
                                  color="white"
                                  bg="mint"
                                  ref={cancelRef.current}
                                  onClick={onClose}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  colorScheme="blue"
                                  onClick={() => {
                                    onClose();
                                    router.push(
                                      "/edit/" +
                                        sentenceData.sentence?.parent?.id
                                    );
                                  }}
                                  ml={3}
                                >
                                  Edit Paragraph
                                </Button>
                              </Box>
                            </AlertDialogBody>
                          )}
                        </AlertDialogContent>
                      </AlertDialogOverlay>
                    </AlertDialog>
                  </Box>
                </HStack>
              </Box>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  ) : null;
};

export default withApollo({ ssr: false })(Edit);
