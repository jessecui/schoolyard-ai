import {
  Box,
  Circle,
  Flex,
  Select,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useMeQuery } from "../generated/graphql";

export const ScoreCard: React.FC<{}> = ({}) => {
  const { data: meData, loading: meLoading } = useMeQuery();

  let subjectToColors: Record<string, string> = {};
  if (meData?.me?.subjectColors) {
    subjectToColors = JSON.parse(meData.me.subjectColors);
  }

  return meData?.me ? (
    <Box
      border="2px"
      borderColor="grayLight"
      borderRadius="md"
      bg="White"
      p={4}
    >
      <Text fontWeight="bold" color="grayMain" fontSize="md">
        Performance Scores
      </Text>
      {meData.me.scores.length > 0 && (
        <Box>
          <Select placeholder="Select Subject" size="sm" mt={2} mb={3}>
            {meData.me.scores.map((score) => (
              <option key={score.subjectName} value={score.subjectName}>
                {score.subjectName}
              </option>
            ))}
          </Select>
          <Stack spacing={1}>
            <Flex align="center">
              <Text fontSize="sm" fontWeight="bold">
                Top Subjects
              </Text>
              <Spacer />
              <Text fontSize="sm" fontWeight="bold">
                Explored
              </Text>
            </Flex>
            {meData.me.scores.map(
              (score, index) =>
                index < 10 && (
                  <Flex align="center" key={score.subjectName}>
                    <Circle
                      mr="4px"
                      size={4}
                      bg={
                        subjectToColors[score.subjectName]
                          ? subjectToColors[score.subjectName]
                          : "grayMain"
                      }
                    />
                    <Text fontSize="sm" whiteSpace="nowrap">
                      {score.subjectName.toLowerCase()}
                    </Text>
                    <Spacer />
                    <Text fontSize="sm" whiteSpace="nowrap">
                      {score.queued + score.correct + score.incorrect}
                    </Text>
                  </Flex>
                )
            )}
          </Stack>
        </Box>
      )}
    </Box>
  ) : null;
};
