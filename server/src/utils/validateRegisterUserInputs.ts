import { RegisterUserInputs } from "../types";

export const validateRegister = (options: RegisterUserInputs) => {
  const errors = [];

  if (options.email.length < 2) {
    errors.push({
      field: "email",
      message: "Length must be greater than 1",
    });
  }
  else if (!options.email.includes("@")) {
    errors.push({
      field: "email",
      message: "Invalid email format",
    });
  }

  if (options.firstName.length < 2) {
    errors.push({
      field: "firstName",
      message: "Length must be greater than 1",
    });
  }

  if (options.lastName.length < 2) {
    errors.push({
      field: "lastName",
      message: "Length must be greater than 1",
    });
  }

  if (options.password.length < 2) {
    errors.push({
      field: "password",
      message: "Length must be greater than 1",
    });
  }

  return errors;
};
