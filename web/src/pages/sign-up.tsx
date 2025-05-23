import { FormControl, FormErrorMessage } from "@chakra-ui/form-control";
import {
  Box,
  Button,
  Center, Checkbox,
  Divider, Image, Link, SimpleGrid, Text, VStack
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { InputField } from "../components/form/InputField";
import { MeDocument, MeQuery, useRegisterMutation } from "../graphql/generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { withApollo } from "../utils/withApollo";

interface registerProps {}

const SignUp: React.FC<registerProps> = ({}) => {
  const router = useRouter();
  const [register] = useRegisterMutation();
  return (
    <Box>
      <Center>
        <Image
          my={30}
          alt="Schoolyard Logo"
          htmlWidth={250}
          src={"/schoolyard_logo.png"}
        />
      </Center>
      <Formik
        initialValues={{
          email: "",
          firstName: "",
          lastName: "",
          password: "",
          terms: false,
        }}
        onSubmit={async (
          { email, firstName, lastName, password, terms },
          { setErrors }
        ) => {
          // Make sure that the user has checked the terms of use
          if (!terms) {
            setErrors({
              terms:
                "Please confirm that you have read and agreed to our Terms of Use.",
            });
            return;
          }

          // Register user and update cache
          const response = await register({
            variables: { options: { email, firstName, lastName, password } },
            update: (cache, { data }) => {
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {
                  __typename: "Query",
                  me: data?.register.user,
                },
              });
            },
          });
          if (
            response.data?.register.errors &&
            response.data?.register.errors.length > 0
          ) {
            setErrors(toErrorMap(response.data.register.errors));
          } else if (response.data?.register.user) {
            router.push("/");
          } else {
            console.log("Register issue response: ", response);
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
              Sign Up
            </Text>
            <Form>
              <VStack spacing={2}>
                <SimpleGrid width="100%" columns={2} spacing={4}>
                  <InputField name="firstName" label="First Name" />
                  <InputField name="lastName" label="Last Name" />
                </SimpleGrid>
                <InputField name="email" label="Email" type="email" />
                <InputField name="password" label="Password" type="password" />
              </VStack>

              <Field name="terms">
                {({ field, form }: any) => (
                  <FormControl isInvalid={form.errors.terms}>
                    <Center>
                      <Checkbox {...field} id="terms" mt={8}>
                        I have read and agreed to the{" "}
                        <NextLink href="/terms-of-use">
                          <Link href="/terms-of-use" color="iris">
                            Terms of Use
                          </Link>
                        </NextLink>
                      </Checkbox>
                    </Center>
                    <Center>
                      <FormErrorMessage>{form.errors.terms}</FormErrorMessage>
                    </Center>
                  </FormControl>
                )}
              </Field>

              <Center>
                <Button
                  mt={4}
                  type="submit"
                  isLoading={isSubmitting}
                  bg="iris"
                  _hover={{
                    bg: "irisDark",
                  }}
                  color="white"
                >
                  Create Account
                </Button>
              </Center>
            </Form>
            <Divider my={8} />
            <Center>
              <Text>Already have an account?&nbsp;</Text>
              <NextLink href="/log-in">
                <Link href="/log-in" color="iris">
                  Log In
                </Link>
              </NextLink>
            </Center>
          </Box>
        )}
      </Formik>
    </Box>
  );
};

export default withApollo({ ssr: false })(SignUp);
