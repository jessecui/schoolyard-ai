import { Box, HStack, Image, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import Dropzone from "react-dropzone";
import { useAddProfilePhotoMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

export const ProfilePhotoUpload: React.FC<{}> = ({}) => {
  const [addProfilePhoto] = useAddProfilePhotoMutation();
  const { data, loading: meLoading } = useMeQuery({
    skip: isServer(),
  });
  const [imageHash, setImageHash] = useState(1);
  return (
    <HStack mb={4} spacing={4}>
      {data?.me?.id && (
        <Image
          alt="Personal Profile Photo"
          borderRadius="full"
          boxSize="80px"
          objectFit="cover"
          src={`http://localhost:4000/profile_photos/${data?.me?.id}_profile.png?${imageHash}`}
          fallback={<Box height="80px" />}
        />
      )}
      <Dropzone
        onDrop={async ([file]) => {
          await addProfilePhoto({
            variables: { photo: file },
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
              Change Profile Photo
            </Text>
          </Box>
        )}
      </Dropzone>
    </HStack>
  );
};
