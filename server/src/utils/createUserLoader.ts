import DataLoader from "dataloader";
import { User } from "../entities/User";

/*
A function that will load all users with one combined SQL command instead of
one for each user, given a list of user IDs to fetch.
*/

export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);
    const userIdToUser: Record<number, User> = {};
    users.forEach((u) => {
      userIdToUser[u.id] = u;
    });

    return userIds.map((userId) => userIdToUser[userId]);
  });
