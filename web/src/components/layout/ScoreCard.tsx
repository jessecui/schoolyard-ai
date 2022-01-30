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
import { ReviewStatus, Score, useMeQuery } from "../../graphql/generated/graphql";
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
  let activeScores: Score[] = [];
  if (meData?.me) {
    subjectToColors = JSON.parse(meData.me.subjectColors);
    if (activeScoreSubjects && activeScoreSubjects.length) {
      activeScores = activeScoreSubjects.map((subject) => {
        return meData.me!.scores.find(
          (score) => score.subjectName == subject
        ) as Score;
      });
    }
  }

  const getNewStatus = (subject: string) => {
    const filteredSubjects = changedSubjects.filter(
      (s) => s.subject == subject
    );
    return filteredSubjects.length ? filteredSubjects[0].newStatus : null;
  };

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
          {activeScoreSubjects && activeScoreSubjects.length ? (
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
          {activeScoreSubjects && activeScoreSubjects.length > 0 ? (
            <Stack spacing={4}>
              {activeScoreSubjects.map(
                (subject, index) =>
                  activeScores[index] && (
                    <Box key={subject}>
                      <Flex align="center" mb={2}>
                        <Circle
                          mr="4px"
                          size="12px"
                          bg={
                            subjectToColors[subject]
                              ? subjectToColors[subject]
                              : "grayMain"
                          }
                        />
                        <Text
                          fontSize="md"
                          whiteSpace="nowrap"
                          fontWeight="bold"
                        >
                          {"#" + subject}
                        </Text>
                      </Flex>
                      <Flex
                        color="blue"
                        fontSize={
                          getNewStatus(subject) == ReviewStatus.Queued
                            ? "xl"
                            : "md"
                        }
                        fontWeight={
                          getNewStatus(subject) == ReviewStatus.Queued
                            ? "bold"
                            : "normal"
                        }
                      >
                        Unanswered <Spacer /> {activeScores[index].queued}
                      </Flex>
                      <Flex
                        color="red"
                        fontSize={
                          getNewStatus(subject) == ReviewStatus.Incorrect
                            ? "xl"
                            : "md"
                        }
                        fontWeight={
                          getNewStatus(subject) == ReviewStatus.Incorrect
                            ? "bold"
                            : "normal"
                        }
                      >
                        Incorrect <Spacer /> {activeScores[index].incorrect}
                      </Flex>
                      <Flex
                        color="green"
                        fontSize={
                          getNewStatus(subject) == ReviewStatus.Correct
                            ? "xl"
                            : "md"
                        }
                        fontWeight={
                          getNewStatus(subject) == ReviewStatus.Correct
                            ? "bold"
                            : "normal"
                        }
                      >
                        Correct <Spacer /> {activeScores[index].correct}
                      </Flex>
                      <Divider my={2} border="1px" color="grayMain" />
                      <Flex fontSize="md">
                        Total: <Spacer />{" "}
                        {activeScores[index].queued +
                          activeScores[index].incorrect +
                          activeScores[index].correct}
                      </Flex>
                    </Box>
                  )
              )}
            </Stack>
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
                        size="12px"
                        bg={
                          subjectToColors[score.subjectName]
                            ? subjectToColors[score.subjectName]
                            : "grayMain"
                        }
                      />
                      <Text
                        fontSize={
                          changedSubjects &&
                          changedSubjects.some(
                            (s) => s.subject === score.subjectName
                          )
                            ? "lg"
                            : "sm"
                        }
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
                        _hover={{
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                        onClick={() => {
                          setChangedSubjects([]);
                          setActiveScoreSubjects([score.subjectName]);
                        }}
                      >
                        {"#" + score.subjectName.toLowerCase()}
                      </Text>
                      <Spacer />
                      <Text
                        fontSize={
                          changedSubjects &&
                          changedSubjects.some(
                            (s) => s.subject === score.subjectName
                          )
                            ? "lg"
                            : "sm"
                        }
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
