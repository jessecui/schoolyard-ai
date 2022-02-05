import {
  Avatar,
  Box,
  HStack, Text,
  VStack
} from "@chakra-ui/react";
import { gql } from "@apollo/client";
import React from "react";
import Dropzone from "react-dropzone";
import {
  useAddProfilePhotoMutation,
  useDeleteProfilePhotoMutation,
  useMeQuery
} from "../../graphql/generated/graphql";

export const ProfilePhotoUpload: React.FC<{
  imageHash: number;
  setImageHash: React.Dispatch<React.SetStateAction<number>>;
}> = ({imageHash, setImageHash}) => {
  const [addProfilePhoto] = useAddProfilePhotoMutation();
  const [deleteProfilePhoto] = useDeleteProfilePhotoMutation();

  const { data, loading: meLoading } = useMeQuery();
  return (
    <HStack mb={4} spacing={4}>
      {data?.me?.photoUrl ? (
        <Avatar
          size="lg"
          bg="white"
          name={`${data.me.firstName} ${data.me.lastName}`}
          src={`${data.me.photoUrl}?${imageHash}`}
          color="white"
        />
      ) : (
        <Avatar size="lg" bg="iris" />
      )}
      <VStack alignItems="left" spacing={1}>
        <Dropzone
          onDrop={async ([file]) => {
            await addProfilePhoto({
              variables: { photo: file },
              update: (cache, { data: responseData }) => {
                if (responseData?.addProfilePhoto) {
                  cache.writeFragment({
                    id: "User:" + data?.me?.id,
                    fragment: gql`
                      fragment _ on User {
                        photoUrl
                      }
                    `,
                    data: {
                      photoUrl: responseData?.addProfilePhoto,
                    },
                  });
                }
              },
            });
            setImageHash(imageHash + 1);
          }}
          maxFiles={1}
          accept="image/jpeg, image/png"
        >
          {({ getRootProps, getInputProps }) => (
            <Box {...getRootProps()}>
              <input {...getInputProps()} />
              <Text
                color="iris"
                fontSize="sm"
                fontWeight="bold"
                _hover={{ color: "irisDark", cursor: "pointer" }}
              >
                {meLoading
                  ? ""
                  : data?.me?.photoUrl
                  ? "Change Profile Photo"
                  : "Add Profile Photo"}
              </Text>
            </Box>
          )}
        </Dropzone>
        {!meLoading && data?.me?.photoUrl && (
          <Text
            color="red.400"
            fontSize="sm"
            fontWeight="normal"
            _hover={{ color: "red.800", cursor: "pointer" }}
            onClick={async () =>
              await deleteProfilePhoto({
                update: (cache) => {
                  cache.writeFragment({
                    id: "User:" + data?.me?.id,
                    fragment: gql`
                      fragment _ on User {
                        photoUrl
                      }
                    `,
                    data: {
                      photoUrl: null,
                    },
                  });
                },
              })
            }
          >
            Delete Photo
          </Text>
        )}
      </VStack>
    </HStack>
  );
};
