import { Box, Container, Grid, GridItem } from "@chakra-ui/layout";
import { useRouter } from "next/router";
import React, {
  cloneElement,
  isValidElement,
  useEffect,
  useState
} from "react";
import {
  Question,
  ReviewStatus
} from "../../graphql/generated/graphql";
import { Navbar } from "./Navbar";
import { ScoreCard } from "./ScoreCard";
import { SideQuestions } from "./SideQuestions";

export interface ChangedSubject {
  subject: string;
  oldStatus: ReviewStatus;
  newStatus: ReviewStatus;
}

export const SiteLayout: React.FC<{}> = ({ children }) => {
  const router = useRouter();
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [activeScoreSubjects, setActiveScoreSubjects] = useState<string[]>([]);
  const [changedSubjects, setChangedSubjects] = useState<ChangedSubject[]>([]);
  const [imageHash, setImageHash] = useState(1);
  const [currentContent, setCurrentContent] = useState("");

  useEffect(() => {
    if (router.pathname !== "/learn/[id]") {
      setAvailableQuestions([]);
    }
    setChangedSubjects([]);
  }, [router]);

  return (
    <>
      <Navbar
        imageHash={imageHash}
        currentContent={currentContent}
        setCurrentContent={setCurrentContent}
      />
      {!currentContent ? (
        <Container maxW="container.xl" pt={4}>
          <Grid templateColumns="repeat(10, 1fr)">
            <GridItem colSpan={3}>
              <Box position="sticky" top="88px">
                <SideQuestions
                  availableQuestions={availableQuestions}
                  setActiveScoreSubjects={setActiveScoreSubjects}
                  setChangedSubjects={setChangedSubjects}
                />
              </Box>
            </GridItem>
            <GridItem colSpan={4}>
              <Container maxW="container.sm">
                {isValidElement(children) &&
                  cloneElement(children, {
                    setAvailableQuestions,
                    setChangedSubjects,
                    setActiveScoreSubjects,
                    imageHash,
                    setImageHash,
                  })}
              </Container>
            </GridItem>
            <GridItem colSpan={3}>
              <Box position="sticky" top="88px">
                <ScoreCard
                  activeScoreSubjects={activeScoreSubjects}
                  setActiveScoreSubjects={setActiveScoreSubjects}
                  changedSubjects={changedSubjects}
                  setChangedSubjects={setChangedSubjects}
                />
              </Box>
            </GridItem>
          </Grid>
        </Container>
      ) : (
        <Container mt={4}>
          {currentContent == "content" &&
            isValidElement(children) &&
            cloneElement(children, {
              setAvailableQuestions,
              setChangedSubjects,
              setActiveScoreSubjects,
              imageHash,
              setImageHash,
            })}
          {currentContent == "questions" && (
            <SideQuestions
              availableQuestions={availableQuestions}
              setActiveScoreSubjects={setActiveScoreSubjects}
              setChangedSubjects={setChangedSubjects}
            />
          )}
          {currentContent == "scorecard" && (
            <ScoreCard
              activeScoreSubjects={activeScoreSubjects}
              setActiveScoreSubjects={setActiveScoreSubjects}
              changedSubjects={changedSubjects}
              setChangedSubjects={setChangedSubjects}
            />
          )}
        </Container>
      )}
    </>
  );
};
