import S3 from "aws-sdk/clients/s3";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { getConnection } from "typeorm";
import { IS_PROD } from "../constants";
import { User } from "../entities/User";
import { MyContext } from "../types";
import { isAuth } from "../utils/isAuth";

const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

console.log("S3 client started");

const uploadFile = async (fileUpload: FileUpload, key: string) => {
  const file = await fileUpload;
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Body: file.createReadStream(),
    Key: `${!IS_PROD ? "test/" : "prod/"}${key}`,
  };

  return s3.upload(uploadParams).promise();
};

export const getFileStream = (key: string) => {
  const downloadParams = {
    Key: `${!IS_PROD ? "test/" : "prod/"}${key}`,
    Bucket: process.env.AWS_BUCKET_NAME,
  };

  let file = s3.getObject(downloadParams).createReadStream();
  return file;
};

const deleteFile = async (key: string) => {
  const deleteParams = {
    Key: `${!IS_PROD ? "test/" : "prod/"}${key}`,
    Bucket: process.env.AWS_BUCKET_NAME,
  };

  s3.deleteObject(deleteParams);
};

@Resolver()
export class ProfilePhotoResolver {
  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async addProfilePhoto(
    @Arg("photo", () => GraphQLUpload)
    photo: FileUpload,
    @Ctx() { req }: MyContext
  ): Promise<string> {
    const photoName = `${req.session.userId}_profile.png`;

    const photoUrl = `${
      IS_PROD ? "https://api.goschoolyard.com" : "http://localhost:4000"
    }/images/${photoName}`;

    await getConnection()
      .createQueryBuilder()
      .update(User)
      .set({
        photoUrl,
      })
      .where({ id: req.session.userId })
      .execute();

    await uploadFile(photo, photoName);
    return photoUrl;
  }

  @Mutation(() => Boolean)
  async deleteProfilePhoto(@Ctx() { req }: MyContext): Promise<boolean> {
    await getConnection()
      .createQueryBuilder()
      .update(User)
      .set({
        photoUrl: undefined,
      })
      .where({ id: req.session.userId })
      .execute();

    const photoName = `${req.session.userId}_profile.png`;
    deleteFile(photoName);

    return true;
  }
}
