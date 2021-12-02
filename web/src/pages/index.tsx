import { ApolloCache, gql } from "@apollo/client";
import { Box, Circle, Flex, HStack, Link, Stack } from "@chakra-ui/layout";
import {
  Alert,
  AlertIcon,
  CloseButton,
  Icon,
  IconButton,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { BiZoomIn } from "react-icons/bi";
import { IoPeople, IoPersonCircle } from "react-icons/io5";
import {
  RiCalendarEventFill,
  RiThumbDownFill,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine,
} from "react-icons/ri";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  AddSentenceVoteMutation,
  MeQuery,
  SentencesQuery,
  useAddSentenceVoteMutation,
  useMeQuery,
  useSentencesQuery,
  VoteType,
} from "../generated/graphql";
import { withApollo } from "../utils/withApollo";

const Index: React.FC<{}> = ({}) => {
  const router = useRouter();
  const { data, loading, fetchMore, variables } = useSentencesQuery({
    variables: {
      limit: 10,
      cursor: null,
    },
    notifyOnNetworkStatusChange: true,
  });
  const { data: meData, loading: meLoading } = useMeQuery();

  const [sentenceData, setSentenceData] = useState<
    SentencesQuery | undefined
  >();
  const [sentenceDataLoading, setSentenceDataLoading] = useState<
    Boolean | undefined
  >();
  const [userData, setUserData] = useState<MeQuery | undefined>();
  const [userDataLoading, setUserDataLoading] = useState<Boolean | undefined>();

  useEffect(() => {
    setSentenceData(data);
    setSentenceDataLoading(loading);
    setUserData(meData);
    setUserDataLoading(meLoading);
  });

  const [addVote] = useAddSentenceVoteMutation();

  const updateAfterVote = (
    cache: ApolloCache<AddSentenceVoteMutation>,
    sentenceId: number,
    newUserVoteType: VoteType | null,
    newUpVoteCount: number,
    newDownVoteCount: number
  ) => {
    if (data) {
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

  let subjectToColors: Record<string, string> = {};
  if (meData?.me?.subjectColors) {
    subjectToColors = JSON.parse(meData.me.subjectColors);
  }

  return sentenceData?.sentences.sentences ? (
    <Box>
      {router.query.deleteSuccess && (
        <Alert status="success" mb={2}>
          <AlertIcon />
          Sentence successfully deleted
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => router.push("/", undefined, { shallow: true })}
          />
        </Alert>
      )}
      <InfiniteScroll
        dataLength={sentenceData.sentences.sentences.length}
        next={() => {
          fetchMore({
            variables: {
              limit: variables?.limit,
              cursor:
                sentenceData.sentences.sentences[
                  sentenceData.sentences.sentences.length - 1
                ].createdAt,
            },
          });
        }}
        hasMore={sentenceData.sentences.hasMore}
        loader={<></>}
        hasChildren={true}
      >
        <Stack spacing={2} pb={4}>
          {sentenceData.sentences.sentences.map((sentence) => (
            <Box
              key={sentence.id}
              border="2px"
              borderColor="grayLight"
              borderRadius="md"
              bg="White"
              p={4}
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
                            size={4}
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
                          await addVote({
                            variables: {
                              sentenceId: sentence!.id,
                              voteType: VoteType.Up,
                            },
                            update: (cache, { data: responseData }) => {
                              const votedSentence =
                                responseData?.addSentenceVote;
                              updateAfterVote(
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
                          await addVote({
                            variables: {
                              sentenceId: sentence!.id,
                              voteType: VoteType.Down,
                            },
                            update: (cache, { data: responseData }) => {
                              const votedSentence =
                                responseData?.addSentenceVote;
                              updateAfterVote(
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
                    <Text color="grayMain" fontSize="sm">
                      <Icon
                        mx="4px"
                        height="24px"
                        as={RiThumbUpLine}
                        h="18px"
                        w="18px"
                      />
                      {sentence.upVoteCount}
                    </Text>
                    <Text color="grayMain" fontSize="sm">
                      <Icon mx="4px" as={RiThumbDownLine} h="18px" w="18px" />
                      {sentence.downVoteCount}
                    </Text>
                  </>
                )}

                <Text color="grayMain" fontSize="sm">
                  <Icon as={IoPeople} mr={1} w={5} h={5} />
                  {sentence.viewCount +
                    (sentence.viewCount == 1 ? " view" : " views")}
                </Text>
                <Text color="grayMain" fontSize="sm">
                  <Icon as={RiCalendarEventFill} mr={1} w={5} h={5} />
                  {new Date(sentence.createdAt).toLocaleString("default", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </HStack>
              <Box mt={3}>
                <NextLink href={"/learn/" + sentence.id}>
                  <Link
                    color="iris"
                    _hover={{ color: "irisDark" }}
                    href={"/learn/" + sentence.id}
                  >
                    <Icon as={BiZoomIn} w="24px" height="24px" />
                    <Text ml={1} as="span" fontWeight="bold" fontSize="md">
                      zoom in
                    </Text>
                  </Link>
                </NextLink>
              </Box>
            </Box>
          ))}{" "}
        </Stack>
      </InfiniteScroll>
    </Box>
  ) : null;
};

export default withApollo({ ssr: true })(Index);
