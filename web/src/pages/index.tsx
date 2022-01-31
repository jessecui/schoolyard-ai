import { Box, Center, Circle, Flex, Link, Stack } from "@chakra-ui/layout";
import {
  Alert,
  AlertIcon,
  Avatar,
  CloseButton,
  Icon, Text
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { BiZoomIn } from "react-icons/bi";
import InfiniteScroll from "react-infinite-scroll-component";
import { Details } from "../components/content/Details";
import {
  MeQuery,
  Sentence,
  SentencesQuery, useMeQuery,
  useSentencesQuery
} from "../graphql/generated/graphql";
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

  let subjectToColors: Record<string, string> = {};
  if (meData?.me?.subjectColors) {
    subjectToColors = JSON.parse(meData.me.subjectColors);
  }

  return sentenceData?.sentences.sentences ? (
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
                  {sentence.creator.photoUrl ? (
                    <Avatar
                      size="md"
                      bg="white"
                      name={`${sentence.creator.firstName} ${sentence.creator.lastName}`}
                      src={`${sentence.creator.photoUrl}`}
                      mr={2}
                      color="white"
                    />
                  ) : (
                    <Avatar size="md" bg="iris" mr={2} />
                  )}
                  <Box>
                    <Text fontWeight="bold" fontSize="md">
                      {sentence.creator.firstName} {sentence.creator.lastName}
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
              <Details
                content={sentence as Sentence}
                userLoggedIn={Boolean(userData?.me)}
              />
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
