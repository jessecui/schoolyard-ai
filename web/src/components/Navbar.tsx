import { useApolloClient } from "@apollo/client";
import { Button } from "@chakra-ui/button";
import {
  Box,
  Center,
  Flex,
  Grid,
  Heading,
  HStack,
  Link,
} from "@chakra-ui/layout";
import {
  Avatar,
  Container,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { IoListCircle, IoLogOut, IoSettings } from "react-icons/io5";
import { MeQuery, useLogoutMutation, useMeQuery } from "../generated/graphql";

interface NavbarProps {
  imageHash: number;
  setImageHash: React.Dispatch<React.SetStateAction<number>>;
}

export const Navbar: React.FC<NavbarProps> = ({ imageHash, setImageHash }) => {
  const apolloClient = useApolloClient();
  const router = useRouter();

  const { data, loading } = useMeQuery();
  const [logout] = useLogoutMutation();

  // Create our own states that set user data only when component mounts
  // Avoids errors where the server renders differently than the client
  const [userData, setUserData] = useState<MeQuery | undefined>();
  const [userDataLoading, setUserDataLoading] = useState<Boolean | undefined>();
  useEffect(() => {
    setUserData(data);
    setUserDataLoading(loading);
  });

  // Profile links give the user the option to log in, see settings, etc.
  let profileLinks;
  if (userDataLoading) {
    // Determining user status
    profileLinks = null;
  } else if (!userData?.me) {
    // User is not logged in
    profileLinks = (
      <Box>
        <NextLink href="/log-in">
          <Button
            color="white"
            bg="iris"
            _hover={{
              bg: "irisDark",
            }}
            variant="solid"
            mr={2}
          >
            log in
          </Button>
        </NextLink>
        <NextLink href="/sign-up">
          <Button
            color="iris"
            border="2px"
            borderColor="iris"
            variant="outline"
            _hover={{
              color: "irisDark",
              borderColor: "irisDark",
            }}
          >
            sign up
          </Button>
        </NextLink>
      </Box>
    );
  } else {
    // User is logged in
    profileLinks = (
      <Flex align="center">
        <Menu>
          <MenuButton
            as={Button}
            leftIcon={
              <Center>
                {data?.me?.photoUrl ? (
                  <Avatar
                    size="sm"
                    bg="iris"
                    name={`${data.me.firstName} ${data.me.lastName}`}
                    src={`${data.me.photoUrl}?${imageHash}`}
                  />
                ) : (
                  <Avatar size="sm" bg="iris" />
                )}
              </Center>
            }
            aria-label="View Profile Options"
            borderRadius="full"
            size="md"
            bg="white"
            _hover={{
              bg: "iris",
              color: "white",
            }}
            _active={{ bg: "iris", color: "white" }}
            color="grayMain"
            _focus={{
              boxShadow: "none",
            }}
          >
            <Text fontWeight="bold">
              {userData.me.firstName + " " + userData.me.lastName}
            </Text>
          </MenuButton>
          <MenuList borderColor="grayLight">
            <NextLink href="/account-settings">
              <Link
                href="/account-settings"
                _hover={{ textDecoration: "none" }}
              >
                <MenuItem
                  icon={
                    <Center>
                      <Icon
                        color="grayMain"
                        as={IoSettings}
                        w="20px"
                        h="20px"
                      />
                    </Center>
                  }
                >
                  <Text fontSize="md">Account Settings</Text>
                </MenuItem>
              </Link>
            </NextLink>
            <NextLink href="/activity-log">
              <Link href="/activity-log" _hover={{ textDecoration: "none" }}>
                <MenuItem
                  icon={
                    <Center>
                      <Icon
                        color="grayMain"
                        as={IoListCircle}
                        w="20px"
                        h="20px"
                      />
                    </Center>
                  }
                >
                  <Text fontSize="md">Activity Log</Text>
                </MenuItem>
              </Link>
            </NextLink>
            <MenuItem
              icon={
                <Center>
                  <Icon color="grayMain" as={IoLogOut} w="20px" h="20px" />
                </Center>
              }
              onClick={async () => {
                await logout();
                await apolloClient.resetStore();
                router.push("/");
              }}
            >
              <Text fontSize="md">Log Out</Text>
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    );
  }
  return (
    <Flex h="72px" bg="white" borderBottom="4px solid #ccc" align="center">
      <Container maxW="container.xl">
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          <Flex align="center">
            <NextLink href="/">
              <Link href="/">
                <Image
                  alt="Schoolyard Logo"
                  htmlWidth={150}
                  src={"/images/schoolyard_logo.png"}
                />
              </Link>
            </NextLink>
          </Flex>

          <Center>
            <HStack spacing="36px">
              <NextLink href="/">
                <Link href="/" style={{ textDecoration: "none" }}>
                  <Heading
                    color={
                      router.asPath === "/" ||
                      router.asPath.startsWith("/?") ||
                      router.asPath.startsWith("/learn")
                        ? "mint"
                        : "grayMain"
                    }
                    textUnderlineOffset="16px"
                    textDecoration={
                      router.asPath === "/" ||
                      router.asPath.startsWith("/?") ||
                      router.asPath.startsWith("/learn")
                        ? "underline"
                        : "none"
                    }
                    _hover={{
                      color: "mint",
                      textDecoration: "underline",
                    }}
                    size="md"
                  >
                    learn
                  </Heading>
                </Link>
              </NextLink>
              <NextLink href="/review">
                <Link href="/review" style={{ textDecoration: "none" }}>
                  <Heading
                    color={
                      router.asPath.startsWith("/review") ? "mint" : "grayMain"
                    }
                    textUnderlineOffset="16px"
                    textDecoration={
                      router.asPath.startsWith("/review") ? "underline" : "none"
                    }
                    _hover={{
                      color: "mint",
                      textDecoration: "underline",
                      textUnderlineOffset: "16px",
                    }}
                    size="md"
                  >
                    review
                  </Heading>
                </Link>
              </NextLink>
              <NextLink href="/create">
                <Link href="/create" style={{ textDecoration: "none" }}>
                  <Heading
                    color={
                      router.asPath.startsWith("/create") ||
                      router.asPath.startsWith("/edit")
                        ? "mint"
                        : "grayMain"
                    }
                    textUnderlineOffset="16px"
                    textDecoration={
                      router.asPath.startsWith("/create") ||
                      router.asPath.startsWith("/edit")
                        ? "underline"
                        : "none"
                    }
                    _hover={{
                      color: "mint",
                      textDecoration: "underline",
                    }}
                    size="md"
                  >
                    create
                  </Heading>
                </Link>
              </NextLink>
            </HStack>
          </Center>

          <Flex align="center">
            <Box align="center" ml={"auto"}>
              {profileLinks}
            </Box>
          </Flex>
        </Grid>
      </Container>
    </Flex>
  );
};
