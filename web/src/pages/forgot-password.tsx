import { Button } from "@chakra-ui/button";
import { Box, Center } from "@chakra-ui/layout";
import { Image, Text } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import React, { useState } from "react";
import LogoImage from "../../public/images/schoolyard_logo.png";
import { InputField } from "../components/form/InputField";
import { useForgotPasswordMutation } from "../generated/graphql";
import { withApollo } from "../utils/withApollo";

export const ForgotPassword: React.FC<{}> = ({}) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [forgotPassword] = useForgotPasswordMutation();

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
        initialValues={{ email: "" }}
        onSubmit={async (values) => {
          await forgotPassword({ variables: values });
          setFormSubmitted(true);
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
            {formSubmitted ? (
              <Text>
                If an account with that email exists, we will send you an 
                email to change your password.
              </Text>
            ) : (
              <Box>
              <Text fontWeight="bold" align="center" mb={4}>
              Forgot Password Form
            </Text>
              <Form>
                <InputField name="email" label="Email" type="email" />
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
                    Send Change Password Email
                  </Button>
                </Center>
              </Form>
              </Box>
            )}
          </Box>
        )}
      </Formik>
    </Box>
  );
};

export default withApollo({ ssr: false })(ForgotPassword);
