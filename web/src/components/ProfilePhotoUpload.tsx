import { Box, HStack, Icon, Image, Text, VStack } from "@chakra-ui/react";
import gql from "graphql-tag";
import React, { useState } from "react";
import Dropzone from "react-dropzone";
import { IoPersonCircle } from "react-icons/io5";
import {
  useAddProfilePhotoMutation,
  useDeleteProfilePhotoMutation,
  useMeQuery,
} from "../generated/graphql";

export const ProfilePhotoUpload: React.FC<{}> = ({}) => {
  const [addProfilePhoto] = useAddProfilePhotoMutation();
  const [deleteProfilePhoto] = useDeleteProfilePhotoMutation();

  const { data, loading: meLoading } = useMeQuery();
  const [imageHash, setImageHash] = useState(1);
  return (
    <HStack mb={4} spacing={4}>
      {data?.me?.photoUrl ? (
        <Image
          alt="Personal Profile Photo"
          borderRadius="full"
          boxSize="80px"
          objectFit="cover"
          src={`${data.me.photoUrl}?${imageHash}`}
        />
      ) : (
        <Icon color="iris" as={IoPersonCircle} w="80px" h="80px" />
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
            fontWeight="bold"
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
