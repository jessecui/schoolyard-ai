import { StarIcon } from "@chakra-ui/icons";
import { Container, Grid, GridItem } from "@chakra-ui/layout";
import {
  Box,
  Button,
  Circle,
  Flex,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { cloneElement, isValidElement, useEffect, useState } from "react";
import { Question, useMeQuery } from "../generated/graphql";
import { Navbar } from "./Navbar";

export const SiteLayout: React.FC<{}> = ({ children }) => {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useMeQuery();
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (router.pathname !== "/learn/[id]") {
      setAvailableQuestions([]);
    }
  }, [router])

  return (
    <>
      <Navbar />
      <Container maxW="container.xl" pt={4}>
        <Grid templateColumns="repeat(10, 1fr)" gap={4}>
          <GridItem colSpan={3}>
            {meData?.me?.id && (
              <Stack spacing={2}>
                {availableQuestions && availableQuestions.length > 0 && (
                  <Box
                    border="2px"
                    borderColor="grayLight"
                    borderRadius="md"
                    bg="White"
                    p={4}
                  >
                    <Text fontWeight="bold" color="grayMain">
                      Available Questions
                    </Text>
                    <Stack py={2} spacing={4}>
                      {availableQuestions.map((question) => (
                        <Box key={question.id}>
                          <Box>
                            <HStack spacing="6px">
                              {question.subjects.map((subject) => (
                                <Flex align="center" key={subject}>
                                  <Circle mr="4px" size={4} bg="grayMain" />
                                  <Text fontSize="xs">{subject}</Text>
                                </Flex>
                              ))}
                            </HStack>
                          </Box>
                          <Text fontWeight="bold" fontSize="lg">
                            {question.question}
                          </Text>
                          <Button
                            mt={1}
                            bg="mint"
                            color="white"
                            size="xs"
                          >
                            <StarIcon mr={2} />
                            <Text as="span" fontSize="sm">
                              save question
                            </Text>
                          </Button>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
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
              </Stack>
            )}
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
