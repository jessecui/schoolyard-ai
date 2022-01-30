import { Button } from "@chakra-ui/button";
import { Box, Center, VStack, Link } from "@chakra-ui/layout";
import { Divider, Image, Text } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import React from "react";
import LogoImage from "../../public/images/schoolyard_logo.png";
import { InputField } from "../components/form/InputField";
import {
  MeDocument,
  MeQuery,
  useLoginMutation,
  useMeQuery,
} from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { withApollo } from "../utils/withApollo";
import NextLink from "next/link";

interface loginProps {}

const LogIn: React.FC<loginProps> = ({}) => {
  const router = useRouter();
  const [login] = useLoginMutation();
  const { data, loading } = useMeQuery();
  if (!loading && data?.me) {
    router.push("/");
  }
  return (
    <Box>
      <Center>
        <Image
          my={30}
          alt="Schoolyard Logo"
          htmlWidth={250}
          src={LogoImage.src}
        />
      </Center>
      <Formik
        initialValues={{ email: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await login({
            variables: values,
            update: (cache, { data }) => {
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {
                  __typename: "Query",
                  me: data?.login.user,
                },
              });
            },
          });
          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors));
          } else if (response.data?.login.user) {
            router.push("/");
          } else {
            console.log("Log in issue response: ", response);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Box
            border="2px"
            borderColor="grayLight"
            borderRadius="md"
            bg="White"
            p={8}
          >
            <Text fontWeight="bold" align="center" mb={4}>
              Log In
            </Text>
            <Form>
              <VStack spacing={2}>
                <InputField name="email" label="Email" type="email" />
                <InputField name="password" label="Password" type="password" />
              </VStack>
              <Center>
                <Button
                  mt={8}
                  type="submit"
                  isLoading={isSubmitting}
                  bg="iris"
                  _hover={{
                    bg: "irisDark",
                  }}
                  color="white"
                >
                  Log In
                </Button>
              </Center>
              <Center>
                <NextLink href="/forgot-password">
                  <Link href="/forgot-password" color="iris" my={2}>
                    Forgot Password?
                  </Link>
                </NextLink>
              </Center>
            </Form>
            <Divider my={8} />
            <Center>
              <Text>New to Schoolyard?&nbsp;</Text>
              <NextLink href="/sign-up">
                <Link href="/sign-up" color="iris">
                  Sign Up
                </Link>
              </NextLink>
            </Center>
          </Box>
        )}
      </Formik>
    </Box>
  );
};

export default withApollo({ ssr: false })(LogIn);
