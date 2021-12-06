import fs, { createWriteStream } from "fs";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { getConnection } from "typeorm";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";

@Resolver()
export class ProfilePhotoResolver {
  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async addProfilePhoto(
    @Arg("photo", () => GraphQLUpload)
    photo: FileUpload,
    @Ctx() { req }: MyContext
  ): Promise<string> {
    const { createReadStream } = await photo;
    const saveFilename = req.session.userId + "_profile.png";
    const photoUrl = "http://localhost:4000/profile_photos/" +
    req.session.userId +
    "_profile.png";

    let imageDir = __dirname + "/../public/profile_photos";
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    await getConnection()
      .createQueryBuilder()
      .update(User)
      .set({
        photoUrl
      })
      .where({ id: req.session.userId })
      .execute();

    await new Promise(async (resolve, reject) => {
      createReadStream()
        .pipe(createWriteStream(imageDir + `/${saveFilename}`))
        .on("finish", () => resolve(true))
        .on("error", () => reject(false));
    });

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
    const filePath =
      __dirname +
      "/../public/profile_photos/" +
      req.session.userId +
      "_profile.png";
    fs.unlinkSync(filePath);
    return true;
  }
}
