import { Form, Formik } from "formik";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { InputField } from "../../components/InputField";
import {
  MeDocument,
  MeQuery,
  useChangePasswordWithTokenMutation,
} from "../../generated/graphql";
import { toErrorMap } from "../../utils/toErrorMap";
import { withApollo } from "../../utils/withApollo";
import { Box, Button, Flex, Link, Image, Center, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import LogoImage from "../../../public/images/schoolyard_logo.png";

const ChangePassword: NextPage<{}> = () => {
  const router = useRouter();
  const [changePassword] = useChangePasswordWithTokenMutation();
  const [tokenError, setTokenError] = useState("");
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
        initialValues={{ newPassword: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await changePassword({
            variables: {
              newPassword: values.newPassword,
              token:
                typeof router.query.token === "string"
                  ? router.query.token
                  : "",
            },
            // Once logged in, we need to set the cache to remember the user
            update: (cache, { data }) => {
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {
                  __typename: "Query",
                  me: data?.changePasswordWithToken.user,
                },
              });
            },
          });
          if (response.data?.changePasswordWithToken.errors) {
            const errorMap = toErrorMap(
              response.data?.changePasswordWithToken.errors
            );
            if ("token" in errorMap) {
              setTokenError(errorMap.token);
            }
            setErrors(errorMap);
          } else if (response.data?.changePasswordWithToken.user) {
            router.push("/");
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
              <InputField
                name="newPassword"
                label="New Password"
                type="password"
              />
              {tokenError ? (
                <Flex>
                  <Box mr={2} style={{ color: "red" }}>
                    {tokenError}
                  </Box>
                  <NextLink href="/forgot-password">
                    <Link color="iris">Click here to get a new one.</Link>
                  </NextLink>
                </Flex>
              ) : null}
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
                  Change Password
                </Button>
              </Center>
            </Form>
          </Box>
        )}
      </Formik>
    </Box>
  );
};

export default withApollo({ ssr: false })(ChangePassword);
