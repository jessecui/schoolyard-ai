import {
  Box,
  Button,
  Circle,
  Divider,
  Flex,
  Select,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { Score, useMeQuery } from "../generated/graphql";

export const ScoreCard: React.FC<{
  activeScoreSubject: string;
  setActiveScoreSubject: React.Dispatch<React.SetStateAction<string>>;
  changedSubjects: string[];
}> = ({ activeScoreSubject, setActiveScoreSubject, changedSubjects }) => {
  const { data: meData, loading: meLoading } = useMeQuery();

  let subjectToColors: Record<string, string> = {};
  let activeScore: Score | null = null;
  if (meData?.me) {
    subjectToColors = JSON.parse(meData.me.subjectColors);
    activeScore = meData.me.scores.find(
      (score) => score.subjectName == activeScoreSubject
    ) as Score;
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
          {activeScoreSubject ? (
            <Button
              onClick={() => setActiveScoreSubject("")}
              bg="none"
              color="iris"
              _hover={{ bg: "none", color: "irisDark" }}
              p={0}
              fontSize="sm"
            >
              Back to all subjects
            </Button>
          ) : (
            <Select
              placeholder="Select Subject"
              size="sm"
              mt={2}
              mb={3}
              value={activeScoreSubject}
              onChange={(e) => setActiveScoreSubject(e.target.value)}
            >
              {meData.me.scores.map((score) => (
                <option key={score.subjectName} value={score.subjectName}>
                  {"#" + score.subjectName}
                </option>
              ))}
            </Select>
          )}
          {activeScoreSubject && activeScore ? (
            <Box>
              <Flex align="center" mb={2}>
                <Circle
                  mr="4px"
                  size={4}
                  bg={
                    subjectToColors[activeScoreSubject]
                      ? subjectToColors[activeScoreSubject]
                      : "grayMain"
                  }
                />
                <Text fontSize="md" whiteSpace="nowrap" fontWeight="bold">
                  {"#" + activeScoreSubject}
                </Text>
              </Flex>
              <Flex color="blue" fontSize="md">
                Unanswered <Spacer /> {activeScore.queued}
              </Flex>
              <Flex color="red" fontSize="md">
                Incorrect <Spacer /> {activeScore.incorrect}
              </Flex>
              <Flex color="green" fontSize="md">
                Correct <Spacer /> {activeScore.correct}
              </Flex>
              <Divider my={2} border="1px" color="grayMain" />
              <Flex fontSize="md">
                Total: <Spacer />{" "}
                {activeScore.queued +
                  activeScore.incorrect +
                  activeScore.correct}
              </Flex>
            </Box>
          ) : (
            <Stack spacing={1}>
              <Flex align="center">
                <Text fontSize="md" fontWeight="bold">
                  Top Subjects
                </Text>
                <Spacer />
                <Text fontSize="md" fontWeight="bold">
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
                      <Text
                        fontSize="sm"
                        whiteSpace="nowrap"
                        fontWeight={
                          changedSubjects &&
                          changedSubjects.includes(score.subjectName)
                            ? "bold"
                            : "normal"
                        }
                        color={
                          changedSubjects &&
                          changedSubjects.includes(score.subjectName)
                            ? "green"
                            : "black"
                        }
                      >
                        {"#" + score.subjectName.toLowerCase()}
                      </Text>
                      <Spacer />
                      <Text
                        fontSize="sm"
                        whiteSpace="nowrap"
                        fontWeight={
                          changedSubjects &&
                          changedSubjects.includes(score.subjectName)
                            ? "bold"
                            : "normal"
                        }
                        color={
                          changedSubjects &&
                          changedSubjects.includes(score.subjectName)
                            ? "green"
                            : "black"
                        }
                      >
                        {score.queued + score.correct + score.incorrect}
                      </Text>
                    </Flex>
                  )
              )}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  ) : null;
};
