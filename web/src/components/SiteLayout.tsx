import { Container, Grid, GridItem } from "@chakra-ui/layout";
import { Box, Text } from "@chakra-ui/react";
import React from "react";
import { useMeQuery } from "../generated/graphql";
import { Navbar } from "./Navbar";

export const SiteLayout: React.FC<{}> = ({ children }) => {
  const { data: meData, loading: meLoading } = useMeQuery();

  return (
    <>
      <Navbar />
      <Container maxW="container.xl" pt={4}>
        <Grid templateColumns="repeat(10, 1fr)" gap={4}>
          <GridItem colSpan={3}>
            {meData?.me?.id && (
              <Box
                border="2px"
                borderColor="grayLight"
                borderRadius="md"
                bg="White"
                p={4}
              >
                <Text fontWeight="bold" color="grayMain">
                  Recently Saved Questions
                </Text>
              </Box>
            )}
          </GridItem>
          <GridItem colSpan={4}>
            <Container maxW="container.sm">{children}</Container>
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
                <Text fontWeight="bold" color="grayMain">
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
