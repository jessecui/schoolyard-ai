import { Container, Grid, GridItem } from "@chakra-ui/layout";
import { useRouter } from "next/router";
import React, {
  cloneElement,
  isValidElement,
  useEffect,
  useState
} from "react";
import {
  Question
} from "../generated/graphql";
import { Navbar } from "./Navbar";
import { ScoreCard } from "./ScoreCard";
import { SideQuestions } from "./SideQuestions";

export const SiteLayout: React.FC<{}> = ({ children }) => {
  const router = useRouter();  
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (router.pathname !== "/learn/[id]") {
      setAvailableQuestions([]);
    }
  }, [router]);

  return (
    <>
      <Navbar />
      <Container maxW="container.xl" pt={4}>
        <Grid templateColumns="repeat(10, 1fr)">
          <GridItem colSpan={3}>
            <SideQuestions availableQuestions={availableQuestions} />
          </GridItem>
          <GridItem colSpan={4}>
            <Container maxW="container.sm">
              {isValidElement(children) &&
                cloneElement(children, { setAvailableQuestions })}
            </Container>
          </GridItem>
          <GridItem colSpan={3}>
            <ScoreCard/>
          </GridItem>
        </Grid>
      </Container>
    </>
  );
};
