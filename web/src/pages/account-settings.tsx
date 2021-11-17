import { Box, SimpleGrid, VStack } from "@chakra-ui/layout";
import { Button, Text } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import React, { useState } from "react";
import { InputField } from "../components/InputField";
import {
  MeDocument,
  MeQuery,
  useChangePasswordMutation,
  useChangeProfileMutation,
  useMeQuery,
} from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { toErrorMap } from "../utils/toErrorMap";
import { withApollo } from "../utils/withApollo";

const AccountSettings: React.FC<{}> = ({}) => {
  const { data, loading: meLoading } = useMeQuery({
    skip: isServer(),
  });
  const [changeProfile] = useChangeProfileMutation();
  const [changePassword] = useChangePasswordMutation();

  const [profileChangeSuccess, setProfileChangeSuccess] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  return (
    <Box>
      {/* Change General Profile Settings Form */}
      <Formik
        enableReinitialize
        initialValues={
          meLoading
            ? { firstName: "", lastName: "", email: "" }
            : {
                firstName: data?.me?.firstName!,
                lastName: data?.me?.lastName!,
                email: data?.me?.email!,
              }
        }
        onSubmit={async (values, { setErrors, resetForm }) => {
          const response = await changeProfile({
            variables: values,
            update: (cache, { data }) => {
              if (data && !data.changeProfile.errors) {
                cache.writeQuery<MeQuery>({
                  query: MeDocument,
                  data: {
                    __typename: "Query",
                    me: data?.changeProfile.user,
                  },
                });
              }
            },
          });
          if (response.data?.changeProfile.errors) {
            setErrors(toErrorMap(response.data.changeProfile.errors));
          } else if (response.data?.changeProfile.user) {
            setProfileChangeSuccess(true);
            const user = response.data?.changeProfile.user;
            resetForm({
              values: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
              },
            });
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
            <Text color="grayMain" fontWeight="bold" mb={4}>
              Profile Settings
            </Text>
            <Form>
              <VStack spacing={2}>
                <SimpleGrid width="100%" columns={2} spacing={4}>
                  <InputField name="firstName" label="First Name" />
                  <InputField name="lastName" label="Last Name" />
                </SimpleGrid>
                <InputField name="email" label="Email" type="email" />
              </VStack>
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
                Save Changes
              </Button>
              {profileChangeSuccess ? (
                <Text mt={2} color="green">
                  Your profile has been updated.
                </Text>
              ) : null}
            </Form>
          </Box>
        )}
      </Formik>

      {/* Change Password Form */}
      <Formik
        initialValues={{
          oldPassword: "",
          newPassword: "",
        }}
        onSubmit={async (values, { setErrors, resetForm }) => {
          const response = await changePassword({
            variables: values,
          });
          if (response.data?.changePassword.errors) {
            setErrors(toErrorMap(response.data.changePassword.errors));
          } else if (response.data?.changePassword.user) {
            resetForm({});
            setPasswordChangeSuccess(true);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Box
            border="2px"
            borderColor="grayLight"
            borderRadius="md"
            bg="White"
            mt={4}
            p={8}
          >
            <Text color="grayMain" fontWeight="bold" mb={4}>
              Change Password
            </Text>
            <Form>
              <VStack spacing={2}>
                <InputField
                  name="oldPassword"
                  label="Old Password"
                  type="password"
                />
                <InputField
                  name="newPassword"
                  label="New Password"
                  type="password"
                />
              </VStack>
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
              {passwordChangeSuccess ? (
                <Text mt={2} color="green">
                  Your password has been updated.
                </Text>
              ) : null}
            </Form>
          </Box>
        )}
      </Formik>
    </Box>
  );
};

export default withApollo({ ssr: false })(AccountSettings);
