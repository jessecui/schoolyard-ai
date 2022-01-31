import { ApolloCache, gql } from "@apollo/client";
import { Center, Flex, Icon, IconButton, Text } from "@chakra-ui/react";
import { IoPeople } from "react-icons/io5";
import {
  RiCalendarEventFill,
  RiThumbDownFill,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine,
} from "react-icons/ri";
import {
  AddQuestionVoteMutation,
  AddSentenceVoteMutation,
  Question,
  Sentence,
  useAddQuestionVoteMutation,
  useAddSentenceVoteMutation,
  VoteType,
} from "../../graphql/generated/graphql";

type DetailsProps = {
  content: Sentence | Question;
  userLoggedIn: boolean;
};

export const Details: React.FC<DetailsProps> = ({
  userLoggedIn,
  content,
}) => {
  const [addSentenceVote] = useAddSentenceVoteMutation();
  const [addQuestionVote] = useAddQuestionVoteMutation();

  const updateAfterSentenceVote = (
    cache: ApolloCache<AddSentenceVoteMutation>,
    sentenceId: number,
    newUserVoteType: VoteType | null,
    newUpVoteCount: number,
    newDownVoteCount: number
  ) => {
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
  };

  const updateAfterQuestionVote = (
    cache: ApolloCache<AddQuestionVoteMutation>,
    questionId: number,
    newUserVoteType: VoteType | null,
    newUpVoteCount: number,
    newDownVoteCount: number
  ) => {
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
  };

  let addVote: (voteType: VoteType) => () => Promise<void>;
  if (content.__typename == "Sentence") {
    addVote = (voteType: VoteType) => async () => {
      await addSentenceVote({
        variables: {
          sentenceId: content!.id,
          voteType,
        },
        update: (cache, { data: responseData }) => {
          const votedSentence = responseData?.addSentenceVote;
          updateAfterSentenceVote(
            cache,
            content!.id,
            votedSentence!.userVoteType as VoteType | null,
            votedSentence!.upVoteCount,
            votedSentence!.downVoteCount
          );
        },
      });
    };
  } else if (content.__typename == "Question") {
    addVote = (voteType: VoteType) => async () => {
      await addQuestionVote({
        variables: {
          questionId: content!.id,
          voteType,
        },
        update: (cache, { data: responseData }) => {
          const votedQuestion = responseData?.addQuestionVote;
          updateAfterQuestionVote(
            cache,
            content!.id,
            votedQuestion!.userVoteType as VoteType | null,
            votedQuestion!.upVoteCount,
            votedQuestion!.downVoteCount
          );
        },
      });
    };
  } else {
    throw new Error("Unsupported content type.");
  }

  const votesDetails = userLoggedIn ? (
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
          onClick={addVote(VoteType.Up)}
          aria-label="Up Vote Content"
          icon={
            content.userVoteType == VoteType.Up ? (
              <RiThumbUpFill />
            ) : (
              <RiThumbUpLine />
            )
          }
        />
        {content.upVoteCount}
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
          onClick={addVote(VoteType.Down)}
          aria-label="Down Vote Content"
          icon={
            content.userVoteType == VoteType.Down ? (
              <RiThumbDownFill />
            ) : (
              <RiThumbDownLine />
            )
          }
        />
        {content.downVoteCount}
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
          {content.upVoteCount}
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
          {content.downVoteCount}
        </Text>
      </Center>
    </>
  );

  const viewsDetails = (
    <Center mr={2}>
      <Icon as={IoPeople} color="grayMain" mr={1} w={5} h={5} />
      <Text color="grayMain" fontSize="sm">
        {content.viewCount + (content.viewCount == 1 ? " view" : " views")}
      </Text>
    </Center>
  );

  const creationDetails = (
    <Center>
      <Icon as={RiCalendarEventFill} color="grayMain" mr={1} w={5} h={5} />
      <Text color="grayMain" fontSize="sm">
        {new Date(content.createdAt).toLocaleString("default", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </Text>
    </Center>
  );

  return (
    <Flex wrap="wrap">
      {votesDetails}
      {viewsDetails}
      {creationDetails}
    </Flex>
  );
};
