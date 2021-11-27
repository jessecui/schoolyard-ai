import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { User } from "../entities/User";
import { MyContext, RegisterUserInputs } from "../types";
import { validateRegister } from "../utils/validateRegisterUserInputs";
import argon2 from "argon2";
import { getConnection } from "typeorm";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { v4 } from "uuid";
import { sendEmail } from "../utils/sendEmail";
import { isAuth } from "../middleware/isAuth";
import { QuestionReview } from "../entities/QuestionReview";

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    // Returns the email of the user only if the user is currently authenticated
    if (req.session.userId === user.id) {
      return user.email;
    }
    return "";
  }

  @FieldResolver(() => [QuestionReview])
  async questionReviews(@Root() _: User, @Ctx() { req }: MyContext) {
    return await QuestionReview.find({
      where: { userId: req.session.userId },
      skip: 0,
      take: 100,
    });
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: RegisterUserInputs,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors && errors.length > 0) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          email: options.email,
          password: hashedPassword,
          firstName: options.firstName,
          lastName: options.lastName,
        })
        .returning("*")
        .execute();
      user = result.raw[0];
    } catch (err) {
      // Duplicate unique field error
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "email",
              message: "An account with this email already exists",
            },
          ],
        };
      }
    }

    // Store the User ID on the session via a cookie to keep them logged in
    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { email: email } });
    const validLogin = user && (await argon2.verify(user.password, password));

    if (!validLogin) {
      return {
        errors: [
          { field: "email", message: "Login credentials are incorrect" },
          {
            field: "password",
            message: "Login credentials are incorrect",
          },
        ],
      };
    }

    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      req.session.destroy((err: any) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log("Logout error: ", err);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }

  // Change password with old password in account settings
  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async changePassword(
    @Arg("oldPassword") oldPassword: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { id: req.session.userId } });

    // Check that the old password is correct
    if (!(await argon2.verify(user!.password, oldPassword))) {
      return {
        errors: [
          {
            field: "oldPassword",
            message: "Incorrect password",
          },
        ],
      };
    }

    // Validate the new password
    if (newPassword.length < 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "Length must be greater than 1",
          },
        ],
      };
    }

    // Update the password
    await User.update(
      { id: req.session.userId },
      {
        password: await argon2.hash(newPassword),
      }
    );
    return { user };
  }

  // Change password with email token when password is forgotten
  @Mutation(() => UserResponse)
  async changePasswordWithToken(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "The token has expired!",
          },
        ],
      };
    }

    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "The user no longer exists",
          },
        ],
      };
    }

    if (newPassword.length < 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "Length must be greater than 1",
          },
        ],
      };
    }

    await User.update(
      { id: userIdNum },
      {
        password: await argon2.hash(newPassword),
      }
    );
    await redis.del(key);

    // Log in the user after the password change
    req.session.userId = user.id;

    return { user };
  }

  // Sends a change password link to the given email
  // if there's an account with the given email
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // The email is not in the DB
      // Return true regardless
      return true;
    }

    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 // 1 Hour expiry time
    );

    const emailHtml = `<p>Change your password here: \
      <a href="http://localhost:3000/change-password/${token}">\
        Reset password\
      </a>\
    </p>`;

    await sendEmail(email, emailHtml);
    return true;
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async changeProfile(
    @Arg("email") email: string,
    @Arg("firstName") firstName: string,
    @Arg("lastName") lastName: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = [];
    if (email.length <= 1) {
      errors.push({
        field: "email",
        message: "Length must be greater than 1",
      });
    } else if (!email.includes("@")) {
      errors.push({
        field: "email",
        message: "Invalid email format",
      });
    } else {
      const currentUser = await User.findOne({
        where: { id: req.session.userId },
      });
      const userWithEmail = await User.findOne({ where: { email: email } });
      if (userWithEmail && userWithEmail.email != currentUser!.email) {
        errors.push({
          field: "email",
          message: "Another user with that email already exists.",
        });
      }
    }
    if (firstName.length <= 1) {
      errors.push({
        field: "firstName",
        message: "Length must be greater than 1",
      });
    }
    if (lastName.length <= 1) {
      errors.push({
        field: "lastName",
        message: "Length must be greater than 1",
      });
    }

    if (errors.length) {
      return { errors };
    }

    await User.update(
      { id: req.session.userId },
      {
        email: email,
        firstName: firstName,
        lastName: lastName,
      }
    );

    const user = await User.findOne({ where: { id: req.session.userId } });
    return { user };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteUser(@Ctx() { req }: MyContext): Promise<boolean> {
    await User.delete(req.session.userId);
    return true;
  }
}
