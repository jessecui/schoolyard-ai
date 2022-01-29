import { gql } from "@apollo/client";
import { ApolloCache } from "@apollo/client/cache";
import {
  Avatar,
  Box,
  Center,
  Circle,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { BiZoomIn } from "react-icons/bi";
import { IoExpand, IoPeople } from "react-icons/io5";
import { MdLibraryAdd } from "react-icons/md";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarEventFill,
  RiEditBoxLine,
  RiThumbDownFill,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine,
} from "react-icons/ri";
import {
  AddSentenceVoteMutation,
  MeQuery,
  Question,
  Sentence,
  SentenceQuery,
  useAddSentenceViewMutation,
  useAddSentenceVoteMutation,
  useMeQuery,
  useSentenceQuery,
  VoteType,
} from "../../generated/graphql";
import { withApollo } from "../../utils/withApollo";

const Learn: React.FC<{
  setAvailableQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
}> = ({ setAvailableQuestions }) => {
  const router = useRouter();
  const { data, loading } = useSentenceQuery({
    variables: { id: Number(router.query.id) },
  });
  const [addVote] = useAddSentenceVoteMutation();
  const [addView] = useAddSentenceViewMutation();
  const { data: meData, loading: meLoading } = useMeQuery();

  const [sentenceData, setSentenceData] = useState<SentenceQuery | undefined>();
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
  useEffect(() => {
    const availableQuestions = data?.sentence?.clones
      ? data.sentence.clones.map((clone) => clone.questions).flat(1)
      : ([] as Question[]);

    setAvailableQuestions(availableQuestions as Question[]);
  }, [data?.sentence?.clones]);

  const [viewedIds, setViewedIds] = useState<number[]>([]);

  const [activeCloneIndex, setActiveCloneIndex] = useState(0);
  const [activeChildrenCloneIndices, setActiveChildrenCloneIndices] = useState<
    number[]
  >([]);

  useEffect(() => {
    console.log(sentenceData?.sentence?.clones);
    setActiveCloneIndex(
      router.query.clone ? parseInt(router.query.clone as string) : 0
    );
    if (sentenceData?.sentence?.id && !router.query.clone) {
      addView({ variables: { sentenceId: sentenceData?.sentence?.id } });

      let newViewedIds = [...viewedIds];
      newViewedIds.push(sentenceData?.sentence?.id);
      setViewedIds(newViewedIds);
    } else if (sentenceData?.sentence?.clones && router.query.clone) {
      addView({
        variables: {
          sentenceId:
            sentenceData?.sentence?.clones[
              parseInt(router.query.clone as string)
            ].id,
        },
      });

      let newViewedIds = [...viewedIds];
      newViewedIds.push(
        sentenceData?.sentence?.clones[parseInt(router.query.clone as string)]
          .id
      );
      setViewedIds(newViewedIds);
    }
  }, [sentenceData?.sentence?.id]);

  useEffect(() => {
    setActiveChildrenCloneIndices(
      router.query.childrenClones
        ? JSON.parse(router.query.childrenClones as string)
        : Array(activeSentence ? activeSentence.children?.length : 0).fill(0)
    );
  }, [activeCloneIndex, sentenceData?.sentence?.id]);

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

  let sentenceList: any[] = [];
  let activeSentence: Sentence | undefined;

  if (sentenceData?.sentence) {
    sentenceList = [
      ...(sentenceData.sentence.clones
        ? (sentenceData.sentence.clones as any[])
        : [null]),
    ].filter(function (element) {
      return element != null && element.children;
    });

    if (sentenceList.length == 0) {
      sentenceList = [sentenceData?.sentence];
    }

    if (sentenceList[0]) {
      activeSentence = sentenceList[activeCloneIndex] as Sentence;
    }
  }

  let clonesWithChildren = (clones: Sentence[]) => {
    let filteredClones = clones.filter((element) => {
      return element.children != undefined;
    });

    if (filteredClones.length == 0) {
      filteredClones = [clones[0]];
    }

    return filteredClones;
  };

  let allParents = sentenceData?.sentence?.clones
    ? sentenceData?.sentence?.clones
        .map((clone) => {
          return { parent: clone.parent, orderNumber: clone.orderNumber };
        })
        .filter(
          (element) =>
            element.parent != undefined && element.orderNumber != undefined
        )
    : [];

  // Deduplicate
  allParents = allParents.filter(
    (parent, index, self) =>
      self.findIndex((p) => p.parent!.id === parent.parent!.id) === index
  );

  let subjectToColors: Record<string, string> = {};
  if (meData?.me?.subjectColors) {
    subjectToColors = JSON.parse(meData.me.subjectColors);
  }

  return activeSentence ? (
    <>
      <Box
        border="2px"
        borderColor="grayLight"
        borderRadius="md"
        bg="White"
        p={4}
      >
        <Flex>
          <Flex align="center" width="80%">
            {activeSentence.teacher.photoUrl ? (
              <Avatar
                size="md"
                bg="white"
                name={`${activeSentence.teacher.firstName} ${activeSentence.teacher.lastName}`}
                src={`${activeSentence.teacher.photoUrl}`}
                mr={2}
                color="white"
              />
            ) : (
              <Avatar size="md" bg="iris" mr={2} />
            )}
            <Box>
              <Text fontWeight="bold" fontSize="md">
                {activeSentence.teacher.firstName}{" "}
                {activeSentence.teacher.lastName}
              </Text>
              <Flex wrap="wrap">
                {activeSentence.subjects.map((subject) => (
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
          <Spacer />
          <HStack spacing={2}>
            <IconButton
              aria-label="Previous Clone"
              size="xs"
              fontSize="18px"
              bg="grayMain"
              color="white"
              icon={<RiArrowLeftSLine />}
              isDisabled={sentenceList.length == 1}
              _disabled={{ display: "none" }}
              onClick={() => {
                let newActiveIndex =
                  activeCloneIndex >= 1
                    ? activeCloneIndex - 1
                    : sentenceList.length - 1;
                setActiveCloneIndex(newActiveIndex);
                activeSentence = sentenceList[newActiveIndex] as Sentence;

                if (!viewedIds.includes(activeSentence.id)) {
                  addView({
                    variables: {
                      sentenceId: activeSentence.id,
                    },
                  });
                  let newViewedIds = [...viewedIds];
                  newViewedIds.push(activeSentence.id);
                  setViewedIds(newViewedIds);
                }
                router.push(
                  "/learn/" +
                    router.query.id +
                    (router.query.id != activeSentence.id.toString()
                      ? "?clone=" +
                        newActiveIndex +
                        "&cloneId=" +
                        activeSentence.id
                      : ""),
                  undefined,
                  { shallow: true }
                );
              }}
            />
            <IconButton
              aria-label="Next Clone"
              size="xs"
              fontSize="18px"
              bg="grayMain"
              color="white"
              icon={<RiArrowRightSLine />}
              isDisabled={sentenceList.length == 1}
              _disabled={{ display: "none" }}
              onClick={() => {
                let newActiveIndex =
                  activeCloneIndex < sentenceList.length - 1
                    ? activeCloneIndex + 1
                    : 0;
                setActiveCloneIndex(newActiveIndex);
                activeSentence = sentenceList[newActiveIndex] as Sentence;
                if (!viewedIds.includes(activeSentence.id)) {
                  addView({
                    variables: {
                      sentenceId: activeSentence.id,
                    },
                  });
                  let newViewedIds = [...viewedIds];
                  newViewedIds.push(activeSentence.id);
                  setViewedIds(newViewedIds);
                }
                router.push(
                  "/learn/" +
                    router.query.id +
                    (router.query.id != activeSentence.id.toString()
                      ? "?clone=" +
                        newActiveIndex +
                        "&cloneId=" +
                        activeSentence.id
                      : ""),
                  undefined,
                  { shallow: true }
                );
              }}
            />
          </HStack>
        </Flex>
        <Text my={2} fontWeight="bold" fontSize="xl">
          {activeSentence.text}
        </Text>
        <Text my={2} fontSize="lg">
          {activeSentence.children
            ? activeSentence.children.map((child) => child.text).join(" ")
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
                        sentenceId: activeSentence!.id,
                        voteType: VoteType.Up,
                      },
                      update: (cache, { data: responseData }) => {
                        const votedSentence = responseData?.addSentenceVote;
                        updateAfterVote(
                          cache,
                          activeSentence!.id,
                          votedSentence!.userVoteType as VoteType | null,
                          votedSentence!.upVoteCount,
                          votedSentence!.downVoteCount
                        );
                      },
                    });
                  }}
                  aria-label="Up Vote Sentence"
                  icon={
                    activeSentence.userVoteType == VoteType.Up ? (
                      <RiThumbUpFill />
                    ) : (
                      <RiThumbUpLine />
                    )
                  }
                />
                {activeSentence.upVoteCount}
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
                        sentenceId: activeSentence!.id,
                        voteType: VoteType.Down,
                      },
                      update: (cache, { data: responseData }) => {
                        const votedSentence = responseData?.addSentenceVote;
                        updateAfterVote(
                          cache,
                          activeSentence!.id,
                          votedSentence!.userVoteType as VoteType | null,
                          votedSentence!.upVoteCount,
                          votedSentence!.downVoteCount
                        );
                      },
                    });
                  }}
                  aria-label="Down Vote Sentence"
                  icon={
                    activeSentence.userVoteType == VoteType.Down ? (
                      <RiThumbDownFill />
                    ) : (
                      <RiThumbDownLine />
                    )
                  }
                />
                {activeSentence.downVoteCount}
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
                  {activeSentence.upVoteCount}
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
                  {activeSentence.downVoteCount}
                </Text>
              </Center>
            </>
          )}
          <Center mr={2}>
            <Icon as={IoPeople} color="grayMain" mr={1} w={5} h={5} />
            <Text color="grayMain" fontSize="sm">
              {activeSentence.viewCount +
                (activeSentence.viewCount == 1 ? " view" : " views")}
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
              {new Date(activeSentence.createdAt).toLocaleString("default", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </Center>
        </Flex>
        <HStack mt={3} spacing={4}>
          {userData?.me && (
            <NextLink
              href={
                "/create" +
                (activeSentence ? "?parent=" + activeSentence.id : "")
              }
            >
              <Link
                color="mint"
                _hover={{ color: "green.500" }}
                href={
                  "/create" +
                  (activeSentence ? "?parent=" + activeSentence.id : "")
                }
              >
                <Center alignItems="left" justifyContent="left">
                  <Icon as={MdLibraryAdd} w="24px" height="24px" />
                  <Text
                    textAlign="left"
                    ml={1}
                    as="span"
                    fontWeight="bold"
                    fontSize="md"
                  >
                    create
                  </Text>
                </Center>
              </Link>
            </NextLink>
          )}
          {userData?.me?.id == activeSentence.teacherId && (
            <NextLink href={"/edit/paragraph/" + activeSentence.id}>
              <Link
                color="red.400"
                _hover={{ color: "red.800" }}
                href={"/edit/paragraph/" + activeSentence.id}
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
          )}
        </HStack>
      </Box>

      {activeSentence.children && (
        <Box
          border="2px"
          borderColor="grayLight"
          borderRadius="md"
          bg="White"
          p={4}
          my={2}
        >
          <Stack spacing="20px">
            {activeSentence.children?.map((child, index) => (
              <Flex key={child.id}>
                <Box width={"75%"}>
                  <Text fontSize="sm">
                    {child.text}
                    &nbsp;
                    {child.clones &&
                      clonesWithChildren(child.clones)[
                        activeChildrenCloneIndices[index]
                      ] &&
                      (
                        child.clones &&
                        clonesWithChildren(child.clones)[
                          activeChildrenCloneIndices[index]
                        ]
                      ).children?.map((grandchild) => (
                        <Text
                          key={grandchild.id}
                          as="span"
                          color="black"
                          fontSize="sm"
                        >
                          {grandchild.text}&nbsp;
                        </Text>
                      ))}
                  </Text>
                </Box>
                <Spacer borderRight="2px solid" borderColor="grayMain" />
                <Flex width={"20%"} ml={2} flexDirection="column">
                  <Center>
                    {child.clones &&
                    clonesWithChildren(child.clones)[
                      activeChildrenCloneIndices[index]
                    ] &&
                    (
                      child.clones &&
                      clonesWithChildren(child.clones)[
                        activeChildrenCloneIndices[index]
                      ]
                    ).teacher.photoUrl ? (
                      <Avatar
                        size="xs"
                        bg="white"
                        name={`${
                          (
                            child.clones &&
                            clonesWithChildren(child.clones)[
                              activeChildrenCloneIndices[index]
                            ]
                          ).teacher.firstName
                        } ${
                          (
                            child.clones &&
                            clonesWithChildren(child.clones)[
                              activeChildrenCloneIndices[index]
                            ]
                          ).teacher.lastName
                        }`}
                        src={`${
                          (
                            child.clones &&
                            clonesWithChildren(child.clones)[
                              activeChildrenCloneIndices[index]
                            ]
                          ).teacher.photoUrl
                        }`}
                        color="white"
                      />
                    ) : (
                      <Avatar size="xs" bg="iris" />
                    )}
                  </Center>
                  <Center>
                    <Text fontWeight="bold" color="grayMain" fontSize="xs">
                      {child.clones &&
                        clonesWithChildren(child.clones)[
                          activeChildrenCloneIndices[index]
                        ] &&
                        (
                          child.clones &&
                          clonesWithChildren(child.clones)[
                            activeChildrenCloneIndices[index]
                          ]
                        ).teacher.firstName[0]}
                      {". "}
                      {child.clones &&
                        clonesWithChildren(child.clones)[
                          activeChildrenCloneIndices[index]
                        ] &&
                        (
                          child.clones &&
                          clonesWithChildren(child.clones)[
                            activeChildrenCloneIndices[index]
                          ]
                        ).teacher.lastName}
                    </Text>
                  </Center>
                  <Center>
                    <HStack spacing="2px">
                      <IconButton
                        aria-label="Previous Child Clone"
                        minWidth="20px"
                        height="20px"
                        fontSize="18px"
                        bg="grayMain"
                        color="white"
                        icon={<RiArrowLeftSLine />}
                        isDisabled={
                          activeSentence?.children &&
                          activeSentence.children[index].clones
                            ? clonesWithChildren(
                                activeSentence.children[index].clones!
                              ).length == 1
                            : true
                        }
                        _disabled={{ visibility: "hidden" }}
                        onClick={() => {
                          let newActiveChildrenCloneIndices = [
                            ...activeChildrenCloneIndices,
                          ];
                          newActiveChildrenCloneIndices[index] =
                            newActiveChildrenCloneIndices[index] > 0
                              ? newActiveChildrenCloneIndices[index] - 1
                              : activeSentence?.children
                              ? clonesWithChildren(
                                  activeSentence.children[index].clones!
                                ).length - 1
                              : 0;
                          setActiveChildrenCloneIndices(
                            newActiveChildrenCloneIndices
                          );
                          router.push(
                            "/learn/" +
                              router.query.id +
                              (router.query.clone
                                ? "?clone=" + router.query.clone
                                : "?") +
                              (newActiveChildrenCloneIndices.some(
                                (item) => item !== 0
                              )
                                ? "&childrenClones=" +
                                  JSON.stringify(newActiveChildrenCloneIndices)
                                : ""),
                            undefined,
                            { shallow: true }
                          );
                        }}
                      />
                      <NextLink
                        href={
                          "/learn/" +
                          (child.clones &&
                            clonesWithChildren(child.clones)[
                              activeChildrenCloneIndices[index]
                            ] &&
                            clonesWithChildren(child.clones)[
                              activeChildrenCloneIndices[index]
                            ].id)
                        }
                      >
                        <Link
                          href={
                            "/learn/" +
                            (child.clones &&
                              clonesWithChildren(child.clones)[
                                activeChildrenCloneIndices[index]
                              ] &&
                              clonesWithChildren(child.clones)[
                                activeChildrenCloneIndices[index]
                              ].id)
                          }
                        >
                          <Center>
                            <Icon
                              as={BiZoomIn}
                              w="24px"
                              height="24px"
                              color="iris"
                              _hover={{ color: "irisDark" }}
                            />
                          </Center>
                        </Link>
                      </NextLink>
                      <IconButton
                        aria-label="Next Child Clone"
                        minWidth="20px"
                        height="20px"
                        fontSize="18px"
                        bg="grayMain"
                        color="white"
                        icon={<RiArrowRightSLine />}
                        isDisabled={
                          activeSentence?.children &&
                          activeSentence.children[index].clones
                            ? clonesWithChildren(
                                activeSentence.children[index].clones!
                              ).length == 1
                            : true
                        }
                        _disabled={{ visibility: "hidden" }}
                        onClick={() => {
                          let newActiveChildrenCloneIndices = [
                            ...activeChildrenCloneIndices,
                          ];
                          newActiveChildrenCloneIndices[index] =
                            newActiveChildrenCloneIndices[index] <
                            (activeSentence?.children
                              ? clonesWithChildren(
                                  activeSentence.children[index].clones!
                                ).length - 1
                              : 0)
                              ? newActiveChildrenCloneIndices[index] + 1
                              : 0;
                          setActiveChildrenCloneIndices(
                            newActiveChildrenCloneIndices
                          );
                          router.push(
                            "/learn/" +
                              router.query.id +
                              (router.query.clone
                                ? "?clone=" + router.query.clone
                                : "?") +
                              (newActiveChildrenCloneIndices.some(
                                (item) => item !== 0
                              )
                                ? "&childrenClones=" +
                                  JSON.stringify(newActiveChildrenCloneIndices)
                                : ""),
                            undefined,
                            { shallow: true }
                          );
                        }}
                      />
                    </HStack>
                  </Center>
                </Flex>
              </Flex>
            ))}
          </Stack>
        </Box>
      )}
      {allParents.length > 0 && (
        <Box
          border="2px"
          borderColor="grayLight"
          borderRadius="md"
          bg="White"
          my={2}
          p={4}
        >
          <Text color="grayMain" fontWeight="bold" mb={2}>
            Usage{allParents.length > 1 ? "s" : ""}
          </Text>
          <Stack spacing={4}>
            {allParents.map((p) => (
              <Box key={p.parent!.id}>
                <Flex align="center" flexWrap="wrap">
                  {p.parent?.teacher.photoUrl ? (
                    <Avatar
                      size="xs"
                      bg="white"
                      name={`${p.parent?.teacher.firstName} ${p.parent?.teacher.lastName}`}
                      src={`${p.parent?.teacher.photoUrl}`}
                      mr={2}
                      color="white"
                    />
                  ) : (
                    <Avatar size="xs" bg="iris" mr={2} />
                  )}
                  <Text fontWeight="bold" color="grayMain" fontSize="sm">
                    {p.parent?.teacher.firstName[0]}
                    {". "}
                    {p.parent?.teacher.lastName}
                  </Text>
                </Flex>
                <Text as="span" fontSize="sm">
                  {p?.parent!.text}{" "}
                </Text>
                {p?.parent!.children?.map((c) => (
                  <Text
                    key={c.orderNumber}
                    fontWeight={
                      c.orderNumber == p.orderNumber ? "bold" : "normal"
                    }
                    as="span"
                    fontSize="sm"
                  >
                    {c.text}{" "}
                  </Text>
                ))}
                <Box mt={1}>
                  <NextLink href={"/learn/" + p.parent?.id}>
                    <Link
                      color="iris"
                      _hover={{ color: "irisDark" }}
                      href={"/learn/" + p.parent?.id}
                    >
                      <Center justifyContent="left">
                        <Icon as={IoExpand} w="20px" height="20px" />
                        <Text ml={1} display="inline" fontSize="sm">
                          expand
                        </Text>
                      </Center>
                    </Link>
                  </NextLink>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </>
  ) : null;
};

export default withApollo({ ssr: true })(Learn);
