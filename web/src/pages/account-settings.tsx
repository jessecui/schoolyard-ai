import { useApolloClient } from "@apollo/client";
import { Box, HStack, SimpleGrid, VStack } from "@chakra-ui/layout";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Text,
} from "@chakra-ui/react";
import { Form, Formik } from "formik";
import router from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { InputField } from "../components/form/InputField";
import { ProfilePhotoUpload } from "../components/form/ProfilePhotoUpload";
import {
  MeDocument,
  MeQuery,
  useChangePasswordMutation,
  useChangeProfileMutation,
  useDeleteUserMutation,
  useMeQuery,
} from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { toErrorMap } from "../utils/toErrorMap";
import { withApollo } from "../utils/withApollo";

const AccountSettings: React.FC<{
  imageHash: number;
  setImageHash: React.Dispatch<React.SetStateAction<number>>;
}> = ({ imageHash, setImageHash }) => {
  const apolloClient = useApolloClient();
  const { data, loading: meLoading } = useMeQuery({
    skip: isServer(),
  });
  const [changeProfile] = useChangeProfileMutation();
  const [changePassword] = useChangePasswordMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [profileChangeSuccess, setProfileChangeSuccess] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Delete button
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  const deleteRef = useRef();

  useEffect(() => {
    if (!meLoading && !data?.me) {
      router.push("/");
    }
  });

  return (
    <Box>
      {/* Change General Profile Settings Form */}
      <Formik
        enableReinitialize
        initialValues={
          data?.me
            ? {
                firstName: data?.me?.firstName!,
                lastName: data?.me?.lastName!,
                email: data?.me?.email!,
              }
            : { firstName: "", lastName: "", email: "" }
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
            p={4}
          >
            <Text color="grayMain" fontWeight="bold" fontSize="md" mb={4}>
              Profile Settings
            </Text>
            <ProfilePhotoUpload imageHash={imageHash} setImageHash={setImageHash} />
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
                <Text mt={2} color="green" fontSize="md">
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
            p={4}
          >
            <Text color="grayMain" fontWeight="bold" fontSize="md" mb={4}>
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
                <Text mt={2} color="green" fontSize="md">
                  Your password has been updated.
                </Text>
              ) : null}
            </Form>
          </Box>
        )}
      </Formik>
      <Box
        border="2px"
        borderColor="grayLight"
        borderRadius="md"
        bg="White"
        mt={4}
        p={4}
      >
        <Button
          size="sm"
          bg="none"
          color="red"
          _hover={{
            bg: "none",
            color: "red.800",
            textDecorationLine: "underline",
          }}
          fontWeight="normal"
          onClick={() => setIsOpen(true)}
          _focus={{
            boxShadow: "none",
          }}
        >
          Delete Account
        </Button>

        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={deleteRef.current}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="md" fontWeight="bold">
                Delete Account
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure? You cannot undo this action afterwards.
                <AlertDialogFooter>
                  <Button
                    color="white"
                    bg="mint"
                    ref={deleteRef.current}
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={async () => {
                      await deleteUser();
                      await apolloClient.resetStore();
                      router.push("/");
                    }}
                    ml={3}
                  >
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogBody>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </Box>
  );
};

export default withApollo({ ssr: false })(AccountSettings);
