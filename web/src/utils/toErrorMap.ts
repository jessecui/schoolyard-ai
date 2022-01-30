import { FieldError } from "../graphql/generated/graphql";

/**
 * Form functions expect a field map but response returns an array of 
 * {field, message} objects.
 * 
 * This helper method converts the array into a map of the field to message
 * so that our form can properly display errors for each field input text box.
 */

export function toErrorMap(errors: FieldError[]) {
  const errorMap: Record<string, string> = {};
  errors.forEach(({ field, message }) => {
    errorMap[field] = message;
  });
  return errorMap;
}
