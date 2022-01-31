import Icon from "@chakra-ui/icon";
import {
  Box,
  Center,
  Circle,
  Divider,
  Flex,
  Heading,
  HStack,
  Link,
  Text,
} from "@chakra-ui/layout";
import { Avatar, Checkbox, Input, Radio, Stack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { BiZoomIn } from "react-icons/bi";
import { GoChecklist } from "react-icons/go";
import { RiEditBoxLine } from "react-icons/ri";
import {
  Question,
  QuestionReview,
  QuestionType,
  ReviewStatus,
  useActivityLogQuery,
  useMeQuery,
} from "../graphql/generated/graphql";
import { withApollo } from "../utils/withApollo";

const ActivityLog: React.FC<{}> = ({}) => {
  const router = useRouter();
  const [contentType, setContentType] = useState("viewed paragraph");
  useEffect(() => {
    if (!meLoading && !meData?.me) {
      router.push("/");
    }
    if (router.query.contentType) {
      setContentType(router.query.contentType as string);
    }
  }, [router.query.contentType]);

  const { data: createdData, loading: createdLoading } = useActivityLogQuery();
  const { data: meData, loading: meLoading } = useMeQuery();

  const questionReviewsSortedByUpdate = createdData?.me?.questionReviews
    ? [...createdData?.me?.questionReviews].sort(
        (a, b) =>
          new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime()
      )
    : [];

  let subjectToColors: Record<string, string> = {};
  if (meData?.me?.subjectColors) {
    subjectToColors = JSON.parse(meData.me.subjectColors);
  }

  const getCreatedQuestionComponent = (question: Question) => (
    <Box
      border="2px"
      borderColor="grayLight"
      borderRadius="md"
      bg="White"
      p={4}
      my={2}
      key={question.id}
    >
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
            {question.subjects
              ? question.subjects.map((subject) => {
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
                      <Text fontSize="sm">{"#" + subject.toLowerCase()}</Text>
                    </Flex>
                  ) : null;
                })
              : null}
          </Flex>
        </Box>
      </Flex>
      <Text my={2} fontWeight="bold" fontSize="xl">
        {question.question}
      </Text>
      <Text color="grayMain" fontSize="sm" my={2}>
        {question.questionType == QuestionType.Single &&
          "Select the correct answer"}
        {question.questionType == QuestionType.Multiple &&
          "Select all that apply"}
        {question.questionType == QuestionType.Text &&
          "Type the correct answer"}
      </Text>
      {(question.questionType == QuestionType.Single ||
        question.questionType == QuestionType.Multiple) && (
        <Stack>
          {question.choices &&
            question.choices.map((option, index) => (
              <Box key={index}>
                {question.questionType == QuestionType.Single && (
                  <Radio
                    size="lg"
                    my="4px"
                    borderColor="grayMain"
                    colorScheme="gray"
                    isChecked={question.answer.includes(option)}
                  >
                    <Text fontSize="md">{option}</Text>
                  </Radio>
                )}

                {question.questionType == QuestionType.Multiple && (
                  <Checkbox
                    size="lg"
                    my="4px"
                    borderColor="grayMain"
                    colorScheme="gray"
                    isChecked={question.answer.includes(option)}
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
      {question.questionType == QuestionType.Text && (
        <Input
          size="sm"
          border="2px"
          borderColor="grayLight"
          value={question.answer[0] ? question.answer[0] : ""}
          readOnly={true}
        />
      )}
      <HStack mt={3} spacing={4}>
        <NextLink href={"/review/" + question.id}>
          <Link
            color="iris"
            _hover={{ color: "irisDark" }}
            href={"/review/" + question.id}
          >
            <Center alignItems="left" justifyContent="left">
              <Icon as={GoChecklist} w="24px" height="24px" />
              <Text
                textAlign="left"
                ml={1}
                as="span"
                fontWeight="bold"
                fontSize="md"
              >
                see question
              </Text>
            </Center>
          </Link>
        </NextLink>
        <NextLink href={"/edit/question/" + question.id}>
          <Link
            color="red.400"
            _hover={{ color: "red.800" }}
            href={"/edit/question/" + question.id}
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
      </HStack>
      <Divider borderColor="grayLight" border="1px" my={3} />
      <Text fontSize="sm" color="grey" mt={4}>
        created on {new Date(question.createdAt).toLocaleString()}
      </Text>
    </Box>
  );

  const getViewedQuestionComponent = (questionReview: QuestionReview) => (
    <Box
      border="2px"
      borderColor="grayLight"
      borderRadius="md"
      bg="White"
      p={4}
      my={2}
      key={"ViewedQuestion: " + questionReview.questionId}
    >
      <Flex align="center">
        {meData?.me?.photoUrl ? (
          <Avatar
            size="md"
            bg="white"
            name={
              questionReview.question.teacher.firstName +
              " " +
              questionReview.question.teacher.lastName
            }
            src={`${questionReview.question.teacher.photoUrl}`}
            mr={2}
            color="white"
          />
        ) : (
          <Avatar size="md" bg="iris" mr={2} />
        )}
        <Box>
          <Text fontWeight="bold" fontSize="md">
            {questionReview.question.teacher.firstName}{" "}
            {questionReview.question.teacher.lastName}
          </Text>
          <Flex wrap="wrap">
            {questionReview.question.subjects
              ? questionReview.question.subjects.map((subject) => {
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
                      <Text fontSize="sm">{"#" + subject.toLowerCase()}</Text>
                    </Flex>
                  ) : null;
                })
              : null}
          </Flex>
        </Box>
      </Flex>
      <Text my={2} fontWeight="bold" fontSize="xl">
        {questionReview.question.question}
      </Text>
      <Text color="grayMain" fontSize="sm" my={2}>
        {questionReview.question.questionType == QuestionType.Single &&
          "Select the correct answer"}
        {questionReview.question.questionType == QuestionType.Multiple &&
          "Select all that apply"}
        {questionReview.question.questionType == QuestionType.Text &&
          "Type the correct answer"}
      </Text>
      {(questionReview.question.questionType == QuestionType.Single ||
        questionReview.question.questionType == QuestionType.Multiple) && (
        <Stack>
          {questionReview.question.choices &&
            questionReview.question.choices.map((option, index) => (
              <Box key={index}>
                {questionReview.question.questionType ==
                  QuestionType.Single && (
                  <Radio
                    size="lg"
                    my="4px"
                    borderColor="grayMain"
                    colorScheme="gray"
                    isDisabled={true}
                  >
                    <Text fontSize="md">{option}</Text>
                  </Radio>
                )}

                {questionReview.question.questionType ==
                  QuestionType.Multiple && (
                  <Checkbox
                    size="lg"
                    my="4px"
                    borderColor="grayMain"
                    colorScheme="gray"
                    isDisabled={true}
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
      {questionReview.question.questionType == QuestionType.Text && (
        <Input
          size="sm"
          border="2px"
          borderColor="grayLight"
          value={""}
          readOnly={true}
        />
      )}
      <HStack mt={3} spacing={4}>
        <NextLink href={"/review/" + questionReview.question.id}>
          <Link
            color="iris"
            _hover={{ color: "irisDark" }}
            href={"/review/" + questionReview.question.id}
          >
            <Center alignItems="left" justifyContent="left">
              <Icon as={GoChecklist} w="24px" height="24px" />
              <Text
                textAlign="left"
                ml={1}
                as="span"
                fontWeight="bold"
                fontSize="md"
              >
                answer question
              </Text>
            </Center>
          </Link>
        </NextLink>
      </HStack>
      <Divider borderColor="grayLight" border="1px" my={3} />
      <Text fontSize="sm" color="grey" mt={4}>
        {questionReview.reviewStatus == ReviewStatus.Queued
          ? "added"
          : questionReview.reviewStatus == ReviewStatus.Incorrect
          ? "answered incorrectly"
          : questionReview.reviewStatus == ReviewStatus.Correct
          ? "answered correctly"
          : ""}
        {" on "}
        {new Date(questionReview.dateUpdated).toLocaleString()}
      </Text>
    </Box>
  );

  const getContentList = () => {
    let contentList = null;

    if (contentType == "viewed paragraph") {
      contentList =
        createdData?.me?.sentenceViews &&
        createdData?.me?.sentenceViews.length > 0 ? (
          createdData?.me?.sentenceViews
            .filter((sentenceView) => sentenceView.sentence.children?.length)
            .map((sentenceView) => (
              <Box
                key={sentenceView.sentence.id}
                border="2px"
                borderColor="grayLight"
                borderRadius="md"
                bg="White"
                p={4}
                mb={2}
              >
                <Flex>
                  <Flex align="center" width="80%">
                    {sentenceView.sentence.teacher.photoUrl ? (
                      <Avatar
                        size="md"
                        bg="white"
                        name={
                          sentenceView.sentence.teacher.firstName +
                          " " +
                          sentenceView.sentence.teacher.lastName
                        }
                        src={`${sentenceView.sentence.teacher.photoUrl}`}
                        mr={2}
                        color="white"
                      />
                    ) : (
                      <Avatar size="md" bg="iris" mr={2} />
                    )}
                    <Box>
                      <Text fontWeight="bold" fontSize="md">
                        {sentenceView.sentence.teacher.firstName}{" "}
                        {sentenceView.sentence.teacher.lastName}
                      </Text>
                      <Flex wrap="wrap">
                        {sentenceView.sentence.subjects.map((subject) => (
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
                  {sentenceView.sentence.text}
                </Text>
                <Text my={2} fontSize="lg">
                  {sentenceView.sentence.children
                    ? sentenceView.sentence.children
                        .map((child) => child.text)
                        .join(" ")
                    : null}
                </Text>
                <HStack mt={3} spacing={4}>
                  <NextLink href={"/learn/" + sentenceView.sentence.id}>
                    <Link
                      color="iris"
                      _hover={{ color: "irisDark" }}
                      href={"/learn/" + sentenceView.sentence.id}
                    >
                      <Center alignItems="left" justifyContent="left">
                        <Icon as={BiZoomIn} w="24px" height="24px" />
                        <Text
                          textAlign="left"
                          ml={1}
                          as="span"
                          fontWeight="bold"
                          fontSize="md"
                        >
                          zoom in
                        </Text>
                      </Center>
                    </Link>
                  </NextLink>
                </HStack>
                <Divider borderColor="grayLight" border="1px" my={3} />
                <Text fontSize="sm" color="grey" mt={4}>
                  last viewed on{" "}
                  {new Date(sentenceView.lastViewed).toLocaleString()}
                </Text>
              </Box>
            ))
        ) : createdData?.me ? (
          <Box
            border="2px"
            borderColor="grayLight"
            borderRadius="md"
            bg="White"
            p={4}
            mb={2}
          >
            <Text fontSize="md">You do not have any viewed paragraphs.</Text>
          </Box>
        ) : null;
    } else if (contentType == "viewed question") {
      contentList =
        createdData?.me?.questionReviews &&
        createdData.me.questionReviews.length > 0 ? (
          questionReviewsSortedByUpdate.map((questionReview) =>
            getViewedQuestionComponent(questionReview as QuestionReview)
          )
        ) : createdData?.me ? (
          <Box
            border="2px"
            borderColor="grayLight"
            borderRadius="md"
            bg="White"
            p={4}
            mb={2}
          >
            <Text fontSize="md">You do not have any viewed questions.</Text>
          </Box>
        ) : null;
    } else if (contentType == "created paragraph") {
      contentList =
        createdData?.me?.createdParagraphs &&
        createdData?.me?.createdParagraphs.length ? (
          createdData?.me?.createdParagraphs.map((sentence) => (
            <Box
              key={sentence.id}
              border="2px"
              borderColor="grayLight"
              borderRadius="md"
              bg="White"
              p={4}
              mb={2}
            >
              <Flex>
                <Flex align="center" width="80%">
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
                      {sentence.teacher.firstName} {sentence.teacher.lastName}
                    </Text>
                    <Flex wrap="wrap">
                      {sentence.subjects.map((subject) => (
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
                {sentence.text}
              </Text>
              <Text my={2} fontSize="lg">
                {sentence.children
                  ? sentence.children.map((child) => child.text).join(" ")
                  : null}
              </Text>
              <HStack mt={3} spacing={4}>
                <NextLink href={"/learn/" + sentence.id}>
                  <Link
                    color="iris"
                    _hover={{ color: "irisDark" }}
                    href={"/learn/" + sentence.id}
                  >
                    <Center alignItems="left" justifyContent="left">
                      <Icon as={BiZoomIn} w="24px" height="24px" />
                      <Text
                        textAlign="left"
                        ml={1}
                        as="span"
                        fontWeight="bold"
                        fontSize="md"
                      >
                        zoom in
                      </Text>
                    </Center>
                  </Link>
                </NextLink>
                <NextLink href={"/edit/paragraph/" + sentence.id}>
                  <Link
                    color="red.400"
                    _hover={{ color: "red.800" }}
                    href={"/edit/paragraph/" + sentence.id}
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
              </HStack>
              <Divider borderColor="grayLight" border="1px" my={3} />
              <Text fontSize="sm" color="grey" mt={4}>
                created on {new Date(sentence.createdAt).toLocaleString()}
              </Text>
            </Box>
          ))
        ) : createdData?.me ? (
          <Box
            border="2px"
            borderColor="grayLight"
            borderRadius="md"
            bg="White"
            p={4}
            mb={2}
          >
            <Text fontSize="md">You do not have any created paragraphs.</Text>
          </Box>
        ) : null;
    } else if (contentType == "created question") {
      contentList =
        createdData?.me?.createdQuestions &&
        createdData?.me?.createdQuestions.length ? (
          createdData?.me?.createdQuestions.map((question) =>
            getCreatedQuestionComponent(question as Question)
          )
        ) : createdData?.me ? (
          <Box
            border="2px"
            borderColor="grayLight"
            borderRadius="md"
            bg="White"
            p={4}
            mb={2}
          >
            <Text fontSize="md">You do not have any created questions.</Text>
          </Box>
        ) : null;
    }
    return contentList ? <Box mt={2}>{contentList}</Box> : null;
  };

  return (
    <>
      <Box
        border="2px"
        borderColor="grayLight"
        borderRadius="md"
        bg="White"
        p={4}
        position="sticky"
        top="72px"
        zIndex={1}
      >
        <Flex wrap="wrap">
          <Flex mx="auto" py={1}>
            <Center>
              <Heading
                width="100px"
                fontSize="sm"
                color={contentType == "viewed paragraph" ? "mint" : "grayMain"}
                _hover={{ color: "mint", cursor: "pointer" }}
                textAlign="center"
                onClick={() => {
                  setContentType("viewed paragraph");
                  router.push("/activity-log?contentType=viewed paragraph");
                }}
              >
                Viewed Paragraphs
              </Heading>
            </Center>
            <Center>
              <Heading
                width="100px"
                fontSize="sm"
                color={contentType == "viewed question" ? "mint" : "grayMain"}
                _hover={{ color: "mint", cursor: "pointer" }}
                textAlign="center"
                onClick={() => {
                  setContentType("viewed question");
                  router.push("/activity-log?contentType=viewed question");
                }}
              >
                Viewed Questions
              </Heading>
            </Center>
          </Flex>
          <Flex mx="auto" py={1}>
            <Center>
              <Heading
                width="100px"
                fontSize="sm"
                color={contentType == "created paragraph" ? "mint" : "grayMain"}
                _hover={{ color: "mint", cursor: "pointer" }}
                textAlign="center"
                onClick={() => {
                  setContentType("created paragraph");
                  router.push("/activity-log?contentType=created paragraph");
                }}
              >
                Created Paragraphs
              </Heading>
            </Center>
            <Center>
              <Heading
                width="100px"
                fontSize="sm"
                color={contentType == "created question" ? "mint" : "grayMain"}
                _hover={{ color: "mint", cursor: "pointer" }}
                textAlign="center"
                onClick={() => {
                  setContentType("created question");
                  router.push("/activity-log?contentType=created question");
                }}
              >
                Created Questions
              </Heading>
            </Center>
          </Flex>
        </Flex>
      </Box>
      {getContentList()}
    </>
  );
};

export default withApollo({ ssr: false })(ActivityLog);
