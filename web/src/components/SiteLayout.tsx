import { Box, Container, Grid, GridItem } from "@chakra-ui/layout";
import { useBreakpointValue, useMediaQuery } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from "react";
import { Question, ReviewStatus } from "../generated/graphql";
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

  useEffect(() => {
    if (router.pathname !== "/learn/[id]") {
      setAvailableQuestions([]);
    }
    setChangedSubjects([]);
  }, [router]);  

  return (
    <>
      <Box position="sticky" top={0} zIndex={1}>
        <Navbar imageHash={imageHash} />
      </Box>
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
    </>
  );
};
