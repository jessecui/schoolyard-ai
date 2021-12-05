import { ApolloCache } from "@apollo/client";
import { IconButton } from "@chakra-ui/button";
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
import { Checkbox, Input, Radio, Stack } from "@chakra-ui/react";
import gql from "graphql-tag";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { BiZoomIn } from "react-icons/bi";
import { GoChecklist } from "react-icons/go";
import { IoPeople, IoPersonCircle } from "react-icons/io5";
import {
  RiCalendarEventFill,
  RiEditBoxLine,
  RiThumbDownFill,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine,
} from "react-icons/ri";
import {
  AddQuestionVoteMutation,
  AddSentenceVoteMutation,
  Question,
  QuestionReview,
  QuestionType,
  ReviewStatus,
  useActivityLogQuery,
  useAddQuestionVoteMutation,
  useAddSentenceVoteMutation,
  useMeQuery,
  VoteType,
} from "../generated/graphql";
import { withApollo } from "../utils/withApollo";

const AccountSettings: React.FC<{}> = ({}) => {
  const router = useRouter();
  const [contentType, setContentType] = useState("viewed paragraph");
  useEffect(() => {
    if (router.query.contentType) {
      setContentType(router.query.contentType as string);
    }
  }, [router.query.contentType]);

  const { data: createdData, loading: createdLoading } = useActivityLogQuery();
  const { data: meData, loading: meLoading } = useMeQuery();

  const [addSentenceVote] = useAddSentenceVoteMutation();
  const [addQuestionVote] = useAddQuestionVoteMutation();

  const questionReviewsSortedByUpdate = createdData?.me?.questionReviews
    ? [...createdData?.me?.questionReviews].sort(
        (a, b) =>
          new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime()
      )
    : [];

  const updateAfterSentenceVote = (
    cache: ApolloCache<AddSentenceVoteMutation>,
    sentenceId: number,
    newUserVoteType: VoteType | null,
    newUpVoteCount: number,
    newDownVoteCount: number
  ) => {
    if (createdData) {
      cache.writeFragment({
        id: "Sentence:" + sentenceId,
        fragment: gql`
          fragment __ on Sentence {
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

  const updateAfterQuestionVote = (
    cache: ApolloCache<AddQuestionVoteMutation>,
    questionId: number,
    newUserVoteType: VoteType | null,
    newUpVoteCount: number,
    newDownVoteCount: number
  ) => {
    if (createdData) {
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
    >
      <Flex align="center">
        <Icon as={IoPersonCircle} color="iris" w={12} h={12} mr={2} />
        <Box>
          <Text fontWeight="bold" fontSize="md">
            {meData?.me?.firstName} {meData?.me?.lastName}
          </Text>
          <HStack spacing="6px">
            {question.subjects
              ? question.subjects.map((subject) => {
                  subject = subject.trim().toLowerCase();
                  return subject ? (
                    <Flex align="center" key={subject}>
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
          </HStack>
        </Box>
      </Flex>
      <Text my={2} fontWeight="bold" fontSize="xl">
        {question.question}
      </Text>
      <HStack spacing={4}>
        {!meLoading && meData && (
          <>
            <Text color="grayMain" fontSize="sm">
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
                  await addQuestionVote({
                    variables: {
                      questionId: question!.id,
                      voteType: VoteType.Up,
                    },
                    update: (cache, { data: responseData }) => {
                      const votedQuestion = responseData?.addQuestionVote;
                      updateAfterQuestionVote(
                        cache,
                        question!.id,
                        votedQuestion!.userVoteType as VoteType | null,
                        votedQuestion!.upVoteCount,
                        votedQuestion!.downVoteCount
                      );
                    },
                  });
                }}
                aria-label="Up Vote Question"
                icon={
                  question.userVoteType == VoteType.Up ? (
                    <RiThumbUpFill />
                  ) : (
                    <RiThumbUpLine />
                  )
                }
              />
              {question.upVoteCount}
            </Text>
            <Text color="grayMain" fontSize="sm">
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
                  await addQuestionVote({
                    variables: {
                      questionId: question!.id,
                      voteType: VoteType.Down,
                    },
                    update: (cache, { data: responseData }) => {
                      const votedQuestion = responseData?.addQuestionVote;
                      updateAfterQuestionVote(
                        cache,
                        question!.id,
                        votedQuestion!.userVoteType as VoteType | null,
                        votedQuestion!.upVoteCount,
                        votedQuestion!.downVoteCount
                      );
                    },
                  });
                }}
                aria-label="Down Vote Question"
                icon={
                  question.userVoteType == VoteType.Down ? (
                    <RiThumbDownFill />
                  ) : (
                    <RiThumbDownLine />
                  )
                }
              />
              {question.downVoteCount}
            </Text>
          </>
        )}

        <Center>
          <Icon as={IoPeople} color="grayMain" mr={1} w={5} h={5} />
          <Text color="grayMain" fontSize="sm">
            {question.viewCount +
              (question.viewCount == 1 ? " view" : " views")}
          </Text>
        </Center>
        <Center>
          <Icon as={RiCalendarEventFill} color="grayMain" mr={1} w={5} h={5} />
          <Text color="grayMain" fontSize="sm">
            {new Date(question.createdAt).toLocaleString("default", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </Center>
      </HStack>
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
    >
      <Flex align="center">
        <Icon as={IoPersonCircle} color="iris" w={12} h={12} mr={2} />
        <Box>
          <Text fontWeight="bold" fontSize="md">
            {meData?.me?.firstName} {meData?.me?.lastName}
          </Text>
          <HStack spacing="6px">
            {questionReview.question.subjects
              ? questionReview.question.subjects.map((subject) => {
                  subject = subject.trim().toLowerCase();
                  return subject ? (
                    <Flex align="center" key={subject}>
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
          </HStack>
        </Box>
      </Flex>
      <Text my={2} fontWeight="bold" fontSize="xl">
        {questionReview.question.question}
      </Text>
      <HStack spacing={4}>
        {!meLoading && meData && (
          <>
            <Text color="grayMain" fontSize="sm">
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
                  await addQuestionVote({
                    variables: {
                      questionId: questionReview.question!.id,
                      voteType: VoteType.Up,
                    },
                    update: (cache, { data: responseData }) => {
                      const votedQuestion = responseData?.addQuestionVote;
                      updateAfterQuestionVote(
                        cache,
                        questionReview.question!.id,
                        votedQuestion!.userVoteType as VoteType | null,
                        votedQuestion!.upVoteCount,
                        votedQuestion!.downVoteCount
                      );
                    },
                  });
                }}
                aria-label="Up Vote Question"
                icon={
                  questionReview.question.userVoteType == VoteType.Up ? (
                    <RiThumbUpFill />
                  ) : (
                    <RiThumbUpLine />
                  )
                }
              />
              {questionReview.question.upVoteCount}
            </Text>
            <Text color="grayMain" fontSize="sm">
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
                  await addQuestionVote({
                    variables: {
                      questionId: questionReview.question!.id,
                      voteType: VoteType.Down,
                    },
                    update: (cache, { data: responseData }) => {
                      const votedQuestion = responseData?.addQuestionVote;
                      updateAfterQuestionVote(
                        cache,
                        questionReview.question!.id,
                        votedQuestion!.userVoteType as VoteType | null,
                        votedQuestion!.upVoteCount,
                        votedQuestion!.downVoteCount
                      );
                    },
                  });
                }}
                aria-label="Down Vote Question"
                icon={
                  questionReview.question.userVoteType == VoteType.Down ? (
                    <RiThumbDownFill />
                  ) : (
                    <RiThumbDownLine />
                  )
                }
              />
              {questionReview.question.downVoteCount}
            </Text>
          </>
        )}

        <Center>
          <Icon as={IoPeople} color="grayMain" mr={1} w={5} h={5} />
          <Text color="grayMain" fontSize="sm">
            {questionReview.question.viewCount +
              (questionReview.question.viewCount == 1 ? " view" : " views")}
          </Text>
        </Center>
        <Center>
          <Icon as={RiCalendarEventFill} color="grayMain" mr={1} w={5} h={5} />
          <Text color="grayMain" fontSize="sm">
            {new Date(questionReview.question.createdAt).toLocaleString(
              "default",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            )}
          </Text>
        </Center>
      </HStack>
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
          createdData?.me?.sentenceViews.map((sentenceView) => (
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
                  <Icon as={IoPersonCircle} color="iris" w={12} h={12} mr={2} />
                  <Box>
                    <Text fontWeight="bold" fontSize="md">
                      {sentenceView.sentence.teacher.firstName}{" "}
                      {sentenceView.sentence.teacher.lastName}
                    </Text>
                    <HStack spacing="6px">
                      {sentenceView.sentence.subjects.map((subject) => (
                        <Flex align="center" key={subject}>
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
                    </HStack>
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
              <HStack spacing={4}>
                {!meLoading && meData?.me ? (
                  <>
                    <Text color="grayMain" fontSize="sm">
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
                          await addSentenceVote({
                            variables: {
                              sentenceId: sentenceView.sentence!.id,
                              voteType: VoteType.Up,
                            },
                            update: (cache, { data: responseData }) => {
                              const votedSentence =
                                responseData?.addSentenceVote;
                              updateAfterSentenceVote(
                                cache,
                                sentenceView.sentence!.id,
                                votedSentence!.userVoteType as VoteType | null,
                                votedSentence!.upVoteCount,
                                votedSentence!.downVoteCount
                              );
                            },
                          });
                        }}
                        aria-label="Up Vote Sentence"
                        icon={
                          sentenceView.sentence.userVoteType == VoteType.Up ? (
                            <RiThumbUpFill />
                          ) : (
                            <RiThumbUpLine />
                          )
                        }
                      />
                      {sentenceView.sentence.upVoteCount}
                    </Text>
                    <Text color="grayMain" fontSize="sm">
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
                          await addSentenceVote({
                            variables: {
                              sentenceId: sentenceView.sentence!.id,
                              voteType: VoteType.Down,
                            },
                            update: (cache, { data: responseData }) => {
                              const votedSentence =
                                responseData?.addSentenceVote;
                              updateAfterSentenceVote(
                                cache,
                                sentenceView.sentence!.id,
                                votedSentence!.userVoteType as VoteType | null,
                                votedSentence!.upVoteCount,
                                votedSentence!.downVoteCount
                              );
                            },
                          });
                        }}
                        aria-label="Down Vote Sentence"
                        icon={
                          sentenceView.sentence.userVoteType ==
                          VoteType.Down ? (
                            <RiThumbDownFill />
                          ) : (
                            <RiThumbDownLine />
                          )
                        }
                      />
                      {sentenceView.sentence.downVoteCount}
                    </Text>
                  </>
                ) : (
                  <>
                    <Center>
                      <Icon
                        mx="4px"
                        height="24px"
                        as={RiThumbUpLine}
                        color="grayMain"
                        h="18px"
                        w="18px"
                      />
                      <Text color="grayMain" fontSize="sm">
                        {sentenceView.sentence.upVoteCount}
                      </Text>
                    </Center>
                    <Center>
                      <Icon
                        mx="4px"
                        as={RiThumbDownLine}
                        color="grayMain"
                        h="18px"
                        w="18px"
                      />
                      <Text color="grayMain" fontSize="sm">
                        {sentenceView.sentence.downVoteCount}
                      </Text>
                    </Center>
                  </>
                )}

                <Center>
                  <Icon as={IoPeople} color="grayMain" mr={1} w={5} h={5} />
                  <Text color="grayMain" fontSize="sm">
                    {sentenceView.sentence.viewCount +
                      (sentenceView.sentence.viewCount == 1
                        ? " view"
                        : " views")}
                  </Text>
                </Center>
                <Center>
                  <Icon
                    as={RiCalendarEventFill}
                    color="grayMain"
                    mr={1}
                    w={5}
                    h={5}
                  />
                  <Text color="grayMain" fontSize="sm">
                    {new Date(sentenceView.sentence.createdAt).toLocaleString(
                      "default",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </Text>
                </Center>
              </HStack>
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
        ) : (
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
        );
    } else if (contentType == "viewed question") {
      contentList =
        createdData?.me?.questionReviews &&
        createdData.me.questionReviews.length > 0 ? (
          questionReviewsSortedByUpdate.map((questionReview) =>
            getViewedQuestionComponent(questionReview as QuestionReview)
          )
        ) : (
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
        );
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
                  <Icon as={IoPersonCircle} color="iris" w={12} h={12} mr={2} />
                  <Box>
                    <Text fontWeight="bold" fontSize="md">
                      {sentence.teacher.firstName} {sentence.teacher.lastName}
                    </Text>
                    <HStack spacing="6px">
                      {sentence.subjects.map((subject) => (
                        <Flex align="center" key={subject}>
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
                    </HStack>
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
              <HStack spacing={4}>
                {!meLoading && meData?.me ? (
                  <>
                    <Text color="grayMain" fontSize="sm">
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
                          await addSentenceVote({
                            variables: {
                              sentenceId: sentence!.id,
                              voteType: VoteType.Up,
                            },
                            update: (cache, { data: responseData }) => {
                              const votedSentence =
                                responseData?.addSentenceVote;
                              updateAfterSentenceVote(
                                cache,
                                sentence!.id,
                                votedSentence!.userVoteType as VoteType | null,
                                votedSentence!.upVoteCount,
                                votedSentence!.downVoteCount
                              );
                            },
                          });
                        }}
                        aria-label="Up Vote Sentence"
                        icon={
                          sentence.userVoteType == VoteType.Up ? (
                            <RiThumbUpFill />
                          ) : (
                            <RiThumbUpLine />
                          )
                        }
                      />
                      {sentence.upVoteCount}
                    </Text>
                    <Text color="grayMain" fontSize="sm">
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
                          await addSentenceVote({
                            variables: {
                              sentenceId: sentence!.id,
                              voteType: VoteType.Down,
                            },
                            update: (cache, { data: responseData }) => {
                              const votedSentence =
                                responseData?.addSentenceVote;
                              updateAfterSentenceVote(
                                cache,
                                sentence!.id,
                                votedSentence!.userVoteType as VoteType | null,
                                votedSentence!.upVoteCount,
                                votedSentence!.downVoteCount
                              );
                            },
                          });
                        }}
                        aria-label="Down Vote Sentence"
                        icon={
                          sentence.userVoteType == VoteType.Down ? (
                            <RiThumbDownFill />
                          ) : (
                            <RiThumbDownLine />
                          )
                        }
                      />
                      {sentence.downVoteCount}
                    </Text>
                  </>
                ) : (
                  <>
                    <Center>
                      <Icon
                        mx="4px"
                        height="24px"
                        as={RiThumbUpLine}
                        color="grayMain"
                        h="18px"
                        w="18px"
                      />
                      <Text color="grayMain" fontSize="sm">
                        {sentence.upVoteCount}
                      </Text>
                    </Center>
                    <Center>
                      <Icon
                        mx="4px"
                        as={RiThumbDownLine}
                        color="grayMain"
                        h="18px"
                        w="18px"
                      />
                      <Text color="grayMain" fontSize="sm">
                        {sentence.downVoteCount}
                      </Text>
                    </Center>
                  </>
                )}

                <Center>
                  <Icon as={IoPeople} color="grayMain" mr={1} w={5} h={5} />
                  <Text color="grayMain" fontSize="sm">
                    {sentence.viewCount +
                      (sentence.viewCount == 1 ? " view" : " views")}
                  </Text>
                </Center>
                <Center>
                  <Icon
                    as={RiCalendarEventFill}
                    color="grayMain"
                    mr={1}
                    w={5}
                    h={5}
                  />
                  <Text color="grayMain" fontSize="sm">
                    {new Date(sentence.createdAt).toLocaleString("default", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </Center>
              </HStack>
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
        ) : (
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
        );
    } else if (contentType == "created question") {
      contentList =
        createdData?.me?.createdQuestions &&
        createdData?.me?.createdQuestions.length ? (
          createdData?.me?.createdQuestions.map((question) =>
            getCreatedQuestionComponent(question as Question)
          )
        ) : (
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
        );
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
        zIndex="1"
      >
        <Flex justifyContent="space-between">
          <Center>
            <Heading
              fontSize="sm"
              color={contentType == "viewed paragraph" ? "mint" : "grayMain"}
              _hover={{ color: "mint", cursor: "pointer" }}
              mr={1}
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
              fontSize="sm"
              color={contentType == "viewed question" ? "mint" : "grayMain"}
              _hover={{ color: "mint", cursor: "pointer" }}
              mx={1}
              textAlign="center"
              onClick={() => {
                setContentType("viewed question");
                router.push("/activity-log?contentType=viewed question");
              }}
            >
              Viewed Questions
            </Heading>
          </Center>
          <Center>
            <Heading
              fontSize="sm"
              color={contentType == "created paragraph" ? "mint" : "grayMain"}
              _hover={{ color: "mint", cursor: "pointer" }}
              mx={1}
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
              fontSize="sm"
              color={contentType == "created question" ? "mint" : "grayMain"}
              _hover={{ color: "mint", cursor: "pointer" }}
              ml={1}
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
      </Box>
      {getContentList()}
    </>
  );
};

export default withApollo({ ssr: false })(AccountSettings);
