import { useApolloClient } from "@apollo/client";
import { Button, IconButton } from "@chakra-ui/button";
import { HamburgerIcon } from "@chakra-ui/icons";
import {
  Box,
  Center,
  Flex,
  Grid,
  Heading,
  HStack,
  Link,
  Spacer,
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
  useBreakpointValue,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { IoListCircle, IoLogOut, IoSettings } from "react-icons/io5";
import { MeQuery, useLogoutMutation, useMeQuery } from "../../graphql/generated/graphql";

interface NavbarProps {
  imageHash: number;
  currentContent: string;
  setCurrentContent: React.Dispatch<React.SetStateAction<string>>;
}

export const Navbar: React.FC<NavbarProps> = ({
  imageHash,
  currentContent,
  setCurrentContent,
}) => {
  const apolloClient = useApolloClient();
  const router = useRouter();

  const { data, loading } = useMeQuery();
  const [logout] = useLogoutMutation();

  const navbarType = useBreakpointValue({ base: "condensed", lg: "full" });
  const logoWidth = useBreakpointValue({ base: 120, sm: 150 });

  useEffect(() => {
    if (navbarType == "condensed") {
      setCurrentContent("content");
    }
    if (navbarType == "full") {
      setCurrentContent("");
    }
  }, [navbarType]);

  useEffect(() => {
    if (navbarType == "condensed") {
      setCurrentContent("content");
    }
  }, [router]);

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
      <Flex align="center">
        <Box align="center" ml={"auto"}>
          <NextLink href="/log-in">
            <Button
              color="white"
              bg="iris"
              _hover={{
                bg: "irisDark",
              }}
              variant="solid"
              mr={2}
              size="sm"
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
              size="sm"
            >
              sign up
            </Button>
          </NextLink>
        </Box>
      </Flex>
    );
  } else {
    // User is logged in
    profileLinks = (
      <Flex align="center">
        <Box align="center" ml={"auto"}>
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
                borderColor: "iris",
              }}
              _active={{ bg: "iris", color: "white", borderColor: "iris" }}
              color="grayMain"
              _focus={{
                boxShadow: "none",
              }}
              border="2px"
              borderColor="grayLight"
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
        </Box>
      </Flex>
    );
  }

  const logo = (
    <Flex align="center">
      <NextLink href="/">
        <Link href="/" _focus={{ boxShadow: "none" }}>
          <Image
            alt="Schoolyard Logo"
            htmlWidth={logoWidth}
            src={"/images/schoolyard_logo.png"}
          />
        </Link>
      </NextLink>
    </Flex>
  );

  const menuBar = (
    <Center>
      <HStack spacing="36px">
        <NextLink href="/">
          <Link
            href="/"
            style={{ textDecoration: "none" }}
            _focus={{
              boxShadow: "none",
            }}
          >
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
          <Link
            href="/review"
            style={{ textDecoration: "none" }}
            _focus={{
              boxShadow: "none",
            }}
          >
            <Heading
              color={router.asPath.startsWith("/review") ? "mint" : "grayMain"}
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
          <Link
            href="/create"
            style={{ textDecoration: "none" }}
            _focus={{
              boxShadow: "none",
            }}
          >
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
  );

  const menuBarCondensed = (
    <Flex mx={2} alignItems="center">
      <Menu>
        <MenuButton
          as={IconButton}
          isRound={true}
          border="2px"
          borderColor="grayLight"
          aria-label="Menu"
          icon={<HamburgerIcon />}
          variant="outline"
        />
        <MenuList minWidth="150px">
          <MenuItem
            onClick={() =>
              router.asPath.startsWith("/learn")
                ? setCurrentContent("content")
                : router.push("/")
            }
          >
            <Heading
              color={
                (router.asPath === "/" ||
                  router.asPath.startsWith("/?") ||
                  router.asPath.startsWith("/learn")) &&
                (currentContent == "" || currentContent == "content")
                  ? "mint"
                  : "grayMain"
              }
              _hover={{
                color: "mint",
              }}
              size="md"
            >
              learn
            </Heading>
          </MenuItem>
          <MenuItem
            onClick={() =>
              router.asPath.startsWith("/review")
                ? setCurrentContent("content")
                : router.push("/review")
            }
          >
            <Heading
              color={
                router.asPath.startsWith("/review") &&
                (currentContent == "" || currentContent == "content")
                  ? "mint"
                  : "grayMain"
              }
              _hover={{
                color: "mint",
              }}
              size="md"
            >
              review
            </Heading>
          </MenuItem>
          <MenuItem onClick={() => router.push("/create")}>
            <Heading
              color={
                router.asPath.startsWith("/create") ||
                (router.asPath.startsWith("/edit") &&
                  (currentContent == "" || currentContent == "content"))
                  ? "mint"
                  : "grayMain"
              }
              _hover={{
                color: "mint",
              }}
              size="md"
            >
              create
            </Heading>
          </MenuItem>
          <MenuItem onClick={() => setCurrentContent("questions")}>
            <Heading
              color={currentContent == "questions" ? "mint" : "grayMain"}
              _hover={{
                color: "mint",
              }}
              size="md"
            >
              questions
            </Heading>
          </MenuItem>
          <MenuItem onClick={() => setCurrentContent("scorecard")}>
            <Heading
              color={currentContent == "scorecard" ? "mint" : "grayMain"}
              _hover={{
                color: "mint",
              }}
              size="md"
            >
              scorecard
            </Heading>
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );

  return (
    <>
        <Flex
          h="72px"
          bg="white"
          borderBottom="4px solid #ccc"
          align="center"
          position="sticky"
          top={0}
          zIndex={2}
        >
          <Container maxW="container.xl">
            {navbarType == "full" && (
              <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                {logo}
                {menuBar}
                {profileLinks}
              </Grid>
            )}
            {navbarType == "condensed" && (
              <Flex>
                {logo}
                <Spacer />
                {menuBarCondensed}
                {profileLinks}
              </Flex>
            )}
          </Container>
        </Flex>      
    </>
  );
};
