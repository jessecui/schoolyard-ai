import { ApolloCache, gql } from "@apollo/client";
import { Box, Center, Circle, Flex, Link, Stack } from "@chakra-ui/layout";
import {
  Alert,
  AlertIcon,
  Avatar,
  CloseButton,
  Icon,
  IconButton,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { BiZoomIn } from "react-icons/bi";
import { IoPeople } from "react-icons/io5";
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
    if (!meLoading && !meData?.me) {
      router.push("/log-in");
    }

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

  return meData?.me && sentenceData?.sentences.sentences ? (
    <Box>
      {router.query.deleteSuccess && (
        <Alert status="success" mb={2}>
          <AlertIcon />
          <Text fontSize="lg">Sentence successfully deleted</Text>
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
                  {sentence.teacher.photoUrl ? (
                    <Avatar
                      size="md"
                      bg="white"
                      name={`${sentence.teacher.firstName} ${sentence.teacher.lastName}`}
                      src={`${sentence.teacher.photoUrl}`}
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
              <Flex wrap="wrap">
                {!meLoading && meData?.me ? (
                  <>
                    <Text color="grayMain" fontSize="sm" mr={2}>
                      <IconButton
                        mr={0.5}
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
                    <Text color="grayMain" fontSize="sm" mr={2}>
                      <IconButton
                        mr={0.5}
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
                    <Center mr={2}>
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
                    <Center mr={2}>
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

                <Center mr={2}>
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
              </Flex>
              <Box mt={3}>
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
              </Box>
            </Box>
          ))}{" "}
        </Stack>
      </InfiniteScroll>
    </Box>
  ) : null;
};

export default withApollo({ ssr: true })(Index);
