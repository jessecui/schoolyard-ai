import { Container, Grid, GridItem } from "@chakra-ui/layout";
import {
  Box, Text
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, {
  cloneElement,
  isValidElement,
  useEffect,
  useState
} from "react";
import {
  Question, useMeQuery
} from "../generated/graphql";
import { Navbar } from "./Navbar";
import { SideQuestions } from "./SideQuestions";

export const SiteLayout: React.FC<{}> = ({ children }) => {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useMeQuery();
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
            {meData?.me?.id && (
              <Box
                border="2px"
                borderColor="grayLight"
                borderRadius="md"
                bg="White"
                p={4}
              >
                <Text fontWeight="bold" color="grayMain" fontSize="md">
                  Performance Scorecard
                </Text>
              </Box>
            )}
          </GridItem>
        </Grid>
      </Container>
    </>
  );
};
