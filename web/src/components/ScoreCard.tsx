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
import { ChangedSubject } from "./SiteLayout";

export const ScoreCard: React.FC<{
  activeScoreSubjects: string[];
  setActiveScoreSubjects: React.Dispatch<React.SetStateAction<string[]>>;
  changedSubjects: ChangedSubject[];
  setChangedSubjects: React.Dispatch<React.SetStateAction<ChangedSubject[]>>;
}> = ({
  activeScoreSubjects,
  setActiveScoreSubjects,
  changedSubjects,
  setChangedSubjects,
}) => {
  const { data: meData, loading: meLoading } = useMeQuery();

  let subjectToColors: Record<string, string> = {};
  let activeScore: Score | null = null;
  if (meData?.me) {
    subjectToColors = JSON.parse(meData.me.subjectColors);
    if (activeScoreSubjects && activeScoreSubjects.length == 1) {
      activeScore = meData.me.scores.find(
        (score) => score.subjectName == activeScoreSubjects[0]
      ) as Score;
    }
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
          {activeScoreSubjects && activeScoreSubjects.length > 0 ? (
            <Button
              onClick={() => {
                setActiveScoreSubjects([]);
                setChangedSubjects([]);
              }}
              bg="none"
              color="iris"
              _hover={{ bg: "none", color: "irisDark" }}
              p={0}
              fontSize="sm"
              fontWeight="normal"
            >
              Back to all subjects
            </Button>
          ) : (
            <Select
              placeholder="Select Subject"
              size="sm"
              mt={2}
              mb={3}
              value={
                activeScoreSubjects && activeScoreSubjects.length == 1
                  ? activeScoreSubjects[0]
                  : ""
              }
              onChange={(e) => {
                setActiveScoreSubjects([e.target.value]);
                setChangedSubjects([]);
              }}
            >
              {meData.me.scores.map((score) => (
                <option key={score.subjectName} value={score.subjectName}>
                  {"#" + score.subjectName}
                </option>
              ))}
            </Select>
          )}
          {activeScoreSubjects &&
          activeScoreSubjects.length == 1 &&
          activeScore ? (
            <Box>
              <Flex align="center" mb={2}>
                <Circle
                  mr="4px"
                  size={4}
                  bg={
                    subjectToColors[activeScoreSubjects[0]]
                      ? subjectToColors[activeScoreSubjects[0]]
                      : "grayMain"
                  }
                />
                <Text fontSize="md" whiteSpace="nowrap" fontWeight="bold">
                  {"#" + activeScoreSubjects[0]}
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
                          changedSubjects.some(
                            (s) => s.subject === score.subjectName
                          )
                            ? "bold"
                            : "normal"
                        }
                        color={
                          changedSubjects &&
                          changedSubjects.some(
                            (s) => s.subject === score.subjectName
                          )
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
                          changedSubjects.some(
                            (s) => s.subject === score.subjectName
                          )
                            ? "bold"
                            : "normal"
                        }
                        color={
                          changedSubjects &&
                          changedSubjects.some(
                            (s) => s.subject === score.subjectName
                          )
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
