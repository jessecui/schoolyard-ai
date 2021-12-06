import React from "react";
import Dropzone from "react-dropzone";
import { useAddProfilePhotoMutation } from "../generated/graphql";

export const ProfilePhotoUpload: React.FC<{}> = ({}) => {
  const [addProfilePhoto] = useAddProfilePhotoMutation();
  return (
    <Dropzone
      onDrop={([file]) => {
        addProfilePhoto({
          variables: { photo: file },
        });
      }}
      maxFiles={1}
      accept="image/jpeg, image/png"
    >
      {({ getRootProps, getInputProps }) => (
        <section>
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <p>+Select Profile Photo</p>
          </div>
        </section>
      )}
    </Dropzone>
  );
};
