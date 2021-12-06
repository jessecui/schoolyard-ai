import fs, { createWriteStream } from "fs";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";

@Resolver()
export class ProfilePhotoResolver {
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async addProfilePhoto(
    @Arg("photo", () => GraphQLUpload)
    photo: FileUpload,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    const { createReadStream } = await photo;
    const saveFilename = req.session.userId + "_profile.png";

    let imageDir = __dirname + "/../../../web/public/images/profile_photos";
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir);
    }
    return new Promise(async (resolve, reject) => {
      createReadStream()
        .pipe(createWriteStream(imageDir + `/${saveFilename}`))
        .on("finish", () => resolve(true))
        .on("error", () => reject(false));
    });
  }
}
