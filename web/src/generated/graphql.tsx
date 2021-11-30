import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions =  {}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: any;
};

export type FieldError = {
  __typename?: 'FieldError';
  field: Scalars['String'];
  message: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addQuestionView?: Maybe<Question>;
  addQuestionVote: Question;
  addSentenceView?: Maybe<Sentence>;
  addSentenceVote: Sentence;
  changePassword: UserResponse;
  changePasswordWithToken: UserResponse;
  changeProfile: UserResponse;
  createParagraph: Sentence;
  createQuestion: Question;
  createQuestionReview: QuestionReview;
  deleteParagraph: Scalars['Boolean'];
  deleteQuestion: Scalars['Boolean'];
  deleteQuestionReview: Scalars['Boolean'];
  deleteUser: Scalars['Boolean'];
  forgotPassword: Scalars['Boolean'];
  login: UserResponse;
  logout: Scalars['Boolean'];
  register: UserResponse;
  updateParagraph?: Maybe<Sentence>;
  updateQuestion?: Maybe<Question>;
  updateQuestionReview?: Maybe<QuestionReview>;
};


export type MutationAddQuestionViewArgs = {
  questionId: Scalars['Int'];
};


export type MutationAddQuestionVoteArgs = {
  questionId: Scalars['Int'];
  voteType: VoteType;
};


export type MutationAddSentenceViewArgs = {
  sentenceId: Scalars['Int'];
};


export type MutationAddSentenceVoteArgs = {
  sentenceId: Scalars['Int'];
  voteType: VoteType;
};


export type MutationChangePasswordArgs = {
  newPassword: Scalars['String'];
  oldPassword: Scalars['String'];
};


export type MutationChangePasswordWithTokenArgs = {
  newPassword: Scalars['String'];
  token: Scalars['String'];
};


export type MutationChangeProfileArgs = {
  email: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
};


export type MutationCreateParagraphArgs = {
  cloningOriginId?: Maybe<Scalars['Int']>;
  paragraphInput: ParagraphInput;
};


export type MutationCreateQuestionArgs = {
  questionInput: QuestionInput;
};


export type MutationCreateQuestionReviewArgs = {
  questionId: Scalars['Int'];
  reviewStatus: ReviewStatus;
};


export type MutationDeleteParagraphArgs = {
  id: Scalars['Int'];
};


export type MutationDeleteQuestionArgs = {
  id: Scalars['Int'];
};


export type MutationDeleteQuestionReviewArgs = {
  questionId: Scalars['Int'];
};


export type MutationForgotPasswordArgs = {
  email: Scalars['String'];
};


export type MutationLoginArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
};


export type MutationRegisterArgs = {
  options: RegisterUserInputs;
};


export type MutationUpdateParagraphArgs = {
  id: Scalars['Int'];
  paragraphInput: ParagraphInput;
};


export type MutationUpdateQuestionArgs = {
  id: Scalars['Int'];
  questionInput: QuestionInput;
};


export type MutationUpdateQuestionReviewArgs = {
  questionId: Scalars['Int'];
  reviewStatus: ReviewStatus;
};

export type PaginatedQuestions = {
  __typename?: 'PaginatedQuestions';
  hasMore: Scalars['Boolean'];
  questions: Array<Question>;
};

export type PaginatedSentences = {
  __typename?: 'PaginatedSentences';
  hasMore: Scalars['Boolean'];
  sentences: Array<Sentence>;
};

export type ParagraphInput = {
  childrenText?: Maybe<Array<Scalars['String']>>;
  subjects?: Maybe<Array<Scalars['String']>>;
  text?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  me?: Maybe<User>;
  question?: Maybe<Question>;
  questionReview?: Maybe<QuestionReview>;
  questions: PaginatedQuestions;
  sentence?: Maybe<Sentence>;
  sentences: PaginatedSentences;
};


export type QueryQuestionArgs = {
  id: Scalars['Int'];
};


export type QueryQuestionReviewArgs = {
  questionId: Scalars['Int'];
};


export type QueryQuestionsArgs = {
  cursor?: Maybe<Scalars['String']>;
  limit?: Maybe<Scalars['Int']>;
};


export type QuerySentenceArgs = {
  id: Scalars['Int'];
};


export type QuerySentencesArgs = {
  cursor?: Maybe<Scalars['String']>;
  limit?: Maybe<Scalars['Int']>;
};

export type Question = {
  __typename?: 'Question';
  answer: Array<Scalars['String']>;
  choices?: Maybe<Array<Scalars['String']>>;
  createdAt: Scalars['DateTime'];
  downVoteCount: Scalars['Float'];
  id: Scalars['Float'];
  question: Scalars['String'];
  questionType: QuestionType;
  sentence?: Maybe<Sentence>;
  sentenceId?: Maybe<Scalars['Float']>;
  subjects: Array<Scalars['String']>;
  teacher: User;
  teacherId: Scalars['Float'];
  upVoteCount: Scalars['Float'];
  updatedAt: Scalars['DateTime'];
  userVoteType?: Maybe<VoteType>;
  viewCount: Scalars['Float'];
};

export type QuestionInput = {
  answer?: Maybe<Array<Scalars['String']>>;
  choices?: Maybe<Array<Scalars['String']>>;
  question?: Maybe<Scalars['String']>;
  questionType?: Maybe<QuestionType>;
  sentenceId?: Maybe<Scalars['Float']>;
  subjects?: Maybe<Array<Scalars['String']>>;
};

export type QuestionReview = {
  __typename?: 'QuestionReview';
  correctStreak: Scalars['Float'];
  dateCreated: Scalars['DateTime'];
  dateNextAvailable: Scalars['DateTime'];
  dateUpdated: Scalars['DateTime'];
  question: Question;
  questionId: Scalars['Float'];
  reviewStatus: ReviewStatus;
  userId: Scalars['Float'];
};

export enum QuestionType {
  Multiple = 'MULTIPLE',
  Single = 'SINGLE',
  Text = 'TEXT'
}

export type RegisterUserInputs = {
  email: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  password: Scalars['String'];
};

export enum ReviewStatus {
  Correct = 'CORRECT',
  Incorrect = 'INCORRECT',
  Queued = 'QUEUED'
}

export type Sentence = {
  __typename?: 'Sentence';
  children?: Maybe<Array<Sentence>>;
  cloneQuality?: Maybe<Scalars['Float']>;
  clones?: Maybe<Array<Sentence>>;
  createdAt: Scalars['DateTime'];
  downVoteCount: Scalars['Float'];
  id: Scalars['Float'];
  orderNumber?: Maybe<Scalars['Float']>;
  parent?: Maybe<Sentence>;
  questions: Array<Question>;
  subjects: Array<Scalars['String']>;
  teacher: User;
  teacherId: Scalars['Float'];
  text: Scalars['String'];
  upVoteCount: Scalars['Float'];
  updatedAt: Scalars['DateTime'];
  userVoteType?: Maybe<VoteType>;
  viewCount: Scalars['Float'];
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime'];
  email: Scalars['String'];
  firstName: Scalars['String'];
  id: Scalars['Float'];
  lastName: Scalars['String'];
  questionReviews: Array<QuestionReview>;
  updatedAt: Scalars['DateTime'];
};

export type UserResponse = {
  __typename?: 'UserResponse';
  errors?: Maybe<Array<FieldError>>;
  user?: Maybe<User>;
};

export enum VoteType {
  Down = 'DOWN',
  Up = 'UP'
}

export type ErrorFragment = { __typename?: 'FieldError', field: string, message: string };

export type UserFragment = { __typename?: 'User', id: number, email: string, firstName: string, lastName: string, questionReviews: Array<{ __typename?: 'QuestionReview', questionId: number, reviewStatus: ReviewStatus, dateCreated: any, dateUpdated: any, dateNextAvailable: any, question: { __typename?: 'Question', question: string, subjects: Array<string> } }> };

export type UserResponseFragment = { __typename?: 'UserResponse', errors?: Array<{ __typename?: 'FieldError', field: string, message: string }> | null | undefined, user?: { __typename?: 'User', id: number, email: string, firstName: string, lastName: string, questionReviews: Array<{ __typename?: 'QuestionReview', questionId: number, reviewStatus: ReviewStatus, dateCreated: any, dateUpdated: any, dateNextAvailable: any, question: { __typename?: 'Question', question: string, subjects: Array<string> } }> } | null | undefined };

export type AddQuestionViewMutationVariables = Exact<{
  questionId: Scalars['Int'];
}>;


export type AddQuestionViewMutation = { __typename?: 'Mutation', addQuestionView?: { __typename?: 'Question', viewCount: number } | null | undefined };

export type AddQuestionVoteMutationVariables = Exact<{
  questionId: Scalars['Int'];
  voteType: VoteType;
}>;


export type AddQuestionVoteMutation = { __typename?: 'Mutation', addQuestionVote: { __typename?: 'Question', upVoteCount: number, downVoteCount: number, userVoteType?: VoteType | null | undefined } };

export type AddSentenceViewMutationVariables = Exact<{
  sentenceId: Scalars['Int'];
}>;


export type AddSentenceViewMutation = { __typename?: 'Mutation', addSentenceView?: { __typename?: 'Sentence', viewCount: number } | null | undefined };

export type AddSentenceVoteMutationVariables = Exact<{
  sentenceId: Scalars['Int'];
  voteType: VoteType;
}>;


export type AddSentenceVoteMutation = { __typename?: 'Mutation', addSentenceVote: { __typename?: 'Sentence', upVoteCount: number, downVoteCount: number, userVoteType?: VoteType | null | undefined } };

export type ChangePasswordMutationVariables = Exact<{
  oldPassword: Scalars['String'];
  newPassword: Scalars['String'];
}>;


export type ChangePasswordMutation = { __typename?: 'Mutation', changePassword: { __typename?: 'UserResponse', errors?: Array<{ __typename?: 'FieldError', field: string, message: string }> | null | undefined, user?: { __typename?: 'User', id: number, email: string, firstName: string, lastName: string, questionReviews: Array<{ __typename?: 'QuestionReview', questionId: number, reviewStatus: ReviewStatus, dateCreated: any, dateUpdated: any, dateNextAvailable: any, question: { __typename?: 'Question', question: string, subjects: Array<string> } }> } | null | undefined } };

export type ChangePasswordWithTokenMutationVariables = Exact<{
  token: Scalars['String'];
  newPassword: Scalars['String'];
}>;


export type ChangePasswordWithTokenMutation = { __typename?: 'Mutation', changePasswordWithToken: { __typename?: 'UserResponse', errors?: Array<{ __typename?: 'FieldError', field: string, message: string }> | null | undefined, user?: { __typename?: 'User', id: number, email: string, firstName: string, lastName: string, questionReviews: Array<{ __typename?: 'QuestionReview', questionId: number, reviewStatus: ReviewStatus, dateCreated: any, dateUpdated: any, dateNextAvailable: any, question: { __typename?: 'Question', question: string, subjects: Array<string> } }> } | null | undefined } };

export type ChangeProfileMutationVariables = Exact<{
  email: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
}>;


export type ChangeProfileMutation = { __typename?: 'Mutation', changeProfile: { __typename?: 'UserResponse', errors?: Array<{ __typename?: 'FieldError', field: string, message: string }> | null | undefined, user?: { __typename?: 'User', id: number, email: string, firstName: string, lastName: string, questionReviews: Array<{ __typename?: 'QuestionReview', questionId: number, reviewStatus: ReviewStatus, dateCreated: any, dateUpdated: any, dateNextAvailable: any, question: { __typename?: 'Question', question: string, subjects: Array<string> } }> } | null | undefined } };

export type CreateParagraphMutationVariables = Exact<{
  paragraphInput: ParagraphInput;
  cloningOriginId?: Maybe<Scalars['Int']>;
}>;


export type CreateParagraphMutation = { __typename?: 'Mutation', createParagraph: { __typename?: 'Sentence', id: number, text: string, subjects: Array<string>, teacher: { __typename?: 'User', firstName: string, lastName: string }, children?: Array<{ __typename?: 'Sentence', id: number, text: string }> | null | undefined } };

export type CreateQuestionMutationVariables = Exact<{
  questionInput: QuestionInput;
}>;


export type CreateQuestionMutation = { __typename?: 'Mutation', createQuestion: { __typename?: 'Question', id: number, createdAt: any, updatedAt: any, question: string, choices?: Array<string> | null | undefined, answer: Array<string>, upVoteCount: number, downVoteCount: number, viewCount: number, teacher: { __typename?: 'User', firstName: string, lastName: string } } };

export type CreateQuestionReviewMutationVariables = Exact<{
  questionId: Scalars['Int'];
  reviewStatus: ReviewStatus;
}>;


export type CreateQuestionReviewMutation = { __typename?: 'Mutation', createQuestionReview: { __typename?: 'QuestionReview', questionId: number, reviewStatus: ReviewStatus, dateCreated: any, dateUpdated: any, dateNextAvailable: any, question: { __typename?: 'Question', question: string, subjects: Array<string> } } };

export type DeleteParagraphMutationVariables = Exact<{
  id: Scalars['Int'];
}>;


export type DeleteParagraphMutation = { __typename?: 'Mutation', deleteParagraph: boolean };

export type DeleteQuestionMutationVariables = Exact<{
  id: Scalars['Int'];
}>;


export type DeleteQuestionMutation = { __typename?: 'Mutation', deleteQuestion: boolean };

export type DeleteQuestionReviewMutationVariables = Exact<{
  questionId: Scalars['Int'];
}>;


export type DeleteQuestionReviewMutation = { __typename?: 'Mutation', deleteQuestionReview: boolean };

export type DeleteUserMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteUserMutation = { __typename?: 'Mutation', deleteUser: boolean };

export type ForgotPasswordMutationVariables = Exact<{
  email: Scalars['String'];
}>;


export type ForgotPasswordMutation = { __typename?: 'Mutation', forgotPassword: boolean };

export type LoginMutationVariables = Exact<{
  email: Scalars['String'];
  password: Scalars['String'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'UserResponse', errors?: Array<{ __typename?: 'FieldError', field: string, message: string }> | null | undefined, user?: { __typename?: 'User', id: number, email: string, firstName: string, lastName: string, questionReviews: Array<{ __typename?: 'QuestionReview', questionId: number, reviewStatus: ReviewStatus, dateCreated: any, dateUpdated: any, dateNextAvailable: any, question: { __typename?: 'Question', question: string, subjects: Array<string> } }> } | null | undefined } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type RegisterMutationVariables = Exact<{
  options: RegisterUserInputs;
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'UserResponse', errors?: Array<{ __typename?: 'FieldError', field: string, message: string }> | null | undefined, user?: { __typename?: 'User', id: number, email: string, firstName: string, lastName: string, questionReviews: Array<{ __typename?: 'QuestionReview', questionId: number, reviewStatus: ReviewStatus, dateCreated: any, dateUpdated: any, dateNextAvailable: any, question: { __typename?: 'Question', question: string, subjects: Array<string> } }> } | null | undefined } };

export type UpdateParagraphMutationVariables = Exact<{
  id: Scalars['Int'];
  paragraphInput: ParagraphInput;
}>;


export type UpdateParagraphMutation = { __typename?: 'Mutation', updateParagraph?: { __typename?: 'Sentence', id: number, text: string, subjects: Array<string>, teacher: { __typename?: 'User', firstName: string, lastName: string }, children?: Array<{ __typename?: 'Sentence', id: number, text: string }> | null | undefined } | null | undefined };

export type UpdateQuestionMutationVariables = Exact<{
  id: Scalars['Int'];
  questionInput: QuestionInput;
}>;


export type UpdateQuestionMutation = { __typename?: 'Mutation', updateQuestion?: { __typename?: 'Question', id: number, createdAt: any, updatedAt: any, question: string, choices?: Array<string> | null | undefined, answer: Array<string>, upVoteCount: number, downVoteCount: number, viewCount: number, teacher: { __typename?: 'User', firstName: string, lastName: string } } | null | undefined };

export type UpdateQuestionReviewMutationVariables = Exact<{
  questionId: Scalars['Int'];
  reviewStatus: ReviewStatus;
}>;


export type UpdateQuestionReviewMutation = { __typename?: 'Mutation', updateQuestionReview?: { __typename?: 'QuestionReview', questionId: number, reviewStatus: ReviewStatus, dateCreated: any, dateUpdated: any, dateNextAvailable: any, question: { __typename?: 'Question', question: string, subjects: Array<string> } } | null | undefined };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: number, email: string, firstName: string, lastName: string, questionReviews: Array<{ __typename?: 'QuestionReview', questionId: number, reviewStatus: ReviewStatus, dateCreated: any, dateUpdated: any, dateNextAvailable: any, question: { __typename?: 'Question', question: string, subjects: Array<string> } }> } | null | undefined };

export type QuestionQueryVariables = Exact<{
  id: Scalars['Int'];
}>;


export type QuestionQuery = { __typename?: 'Query', question?: { __typename?: 'Question', id: number, question: string, questionType: QuestionType, choices?: Array<string> | null | undefined, answer: Array<string>, teacherId: number, subjects: Array<string>, upVoteCount: number, downVoteCount: number, userVoteType?: VoteType | null | undefined, viewCount: number, createdAt: any, updatedAt: any, teacher: { __typename?: 'User', firstName: string, lastName: string }, sentence?: { __typename?: 'Sentence', id: number, text: string } | null | undefined } | null | undefined };

export type QuestionReviewQueryVariables = Exact<{
  questionId: Scalars['Int'];
}>;


export type QuestionReviewQuery = { __typename?: 'Query', questionReview?: { __typename?: 'QuestionReview', reviewStatus: ReviewStatus, dateCreated: any, dateUpdated: any, dateNextAvailable: any } | null | undefined };

export type QuestionsQueryVariables = Exact<{
  limit: Scalars['Int'];
  cursor?: Maybe<Scalars['String']>;
}>;


export type QuestionsQuery = { __typename?: 'Query', questions: { __typename?: 'PaginatedQuestions', hasMore: boolean, questions: Array<{ __typename?: 'Question', id: number, question: string, questionType: QuestionType, choices?: Array<string> | null | undefined, answer: Array<string>, subjects: Array<string>, upVoteCount: number, downVoteCount: number, userVoteType?: VoteType | null | undefined, viewCount: number, createdAt: any, teacher: { __typename?: 'User', firstName: string, lastName: string } }> } };

export type SentenceQueryVariables = Exact<{
  id: Scalars['Int'];
}>;


export type SentenceQuery = { __typename?: 'Query', sentence?: { __typename?: 'Sentence', id: number, text: string, subjects: Array<string>, upVoteCount: number, downVoteCount: number, userVoteType?: VoteType | null | undefined, viewCount: number, createdAt: any, updatedAt: any, teacherId: number, orderNumber?: number | null | undefined, teacher: { __typename?: 'User', firstName: string, lastName: string }, children?: Array<{ __typename?: 'Sentence', id: number, text: string, upVoteCount: number, downVoteCount: number, orderNumber?: number | null | undefined, teacher: { __typename?: 'User', firstName: string, lastName: string }, children?: Array<{ __typename?: 'Sentence', id: number, text: string }> | null | undefined }> | null | undefined, parent?: { __typename?: 'Sentence', id: number, text: string, subjects: Array<string>, upVoteCount: number, downVoteCount: number, viewCount: number, createdAt: any, teacher: { __typename?: 'User', firstName: string, lastName: string }, children?: Array<{ __typename?: 'Sentence', id: number, text: string }> | null | undefined } | null | undefined, clones?: Array<{ __typename?: 'Sentence', id: number, text: string, subjects: Array<string>, teacherId: number, upVoteCount: number, downVoteCount: number, userVoteType?: VoteType | null | undefined, viewCount: number, createdAt: any, orderNumber?: number | null | undefined, questions: Array<{ __typename?: 'Question', id: number, question: string, subjects: Array<string> }>, parent?: { __typename?: 'Sentence', id: number, text: string, teacher: { __typename?: 'User', firstName: string, lastName: string }, children?: Array<{ __typename?: 'Sentence', text: string, orderNumber?: number | null | undefined }> | null | undefined } | null | undefined, teacher: { __typename?: 'User', id: number, firstName: string, lastName: string }, children?: Array<{ __typename?: 'Sentence', id: number, text: string, teacher: { __typename?: 'User', firstName: string, lastName: string }, children?: Array<{ __typename?: 'Sentence', id: number, text: string }> | null | undefined, clones?: Array<{ __typename?: 'Sentence', id: number, text: string, teacher: { __typename?: 'User', firstName: string, lastName: string }, children?: Array<{ __typename?: 'Sentence', id: number, text: string }> | null | undefined }> | null | undefined }> | null | undefined }> | null | undefined, questions: Array<{ __typename?: 'Question', id: number, question: string, subjects: Array<string> }> } | null | undefined };

export type SentencesQueryVariables = Exact<{
  limit: Scalars['Int'];
  cursor?: Maybe<Scalars['String']>;
}>;


export type SentencesQuery = { __typename?: 'Query', sentences: { __typename?: 'PaginatedSentences', hasMore: boolean, sentences: Array<{ __typename?: 'Sentence', id: number, text: string, subjects: Array<string>, upVoteCount: number, downVoteCount: number, userVoteType?: VoteType | null | undefined, viewCount: number, createdAt: any, teacher: { __typename?: 'User', firstName: string, lastName: string }, children?: Array<{ __typename?: 'Sentence', text: string }> | null | undefined }> } };

export const ErrorFragmentDoc = gql`
    fragment Error on FieldError {
  field
  message
}
    `;
export const UserFragmentDoc = gql`
    fragment User on User {
  id
  email
  firstName
  lastName
  questionReviews {
    questionId
    reviewStatus
    dateCreated
    dateUpdated
    dateNextAvailable
    question {
      question
      subjects
    }
  }
}
    `;
export const UserResponseFragmentDoc = gql`
    fragment UserResponse on UserResponse {
  errors {
    ...Error
  }
  user {
    ...User
  }
}
    ${ErrorFragmentDoc}
${UserFragmentDoc}`;
export const AddQuestionViewDocument = gql`
    mutation AddQuestionView($questionId: Int!) {
  addQuestionView(questionId: $questionId) {
    viewCount
  }
}
    `;
export type AddQuestionViewMutationFn = Apollo.MutationFunction<AddQuestionViewMutation, AddQuestionViewMutationVariables>;

/**
 * __useAddQuestionViewMutation__
 *
 * To run a mutation, you first call `useAddQuestionViewMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddQuestionViewMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addQuestionViewMutation, { data, loading, error }] = useAddQuestionViewMutation({
 *   variables: {
 *      questionId: // value for 'questionId'
 *   },
 * });
 */
export function useAddQuestionViewMutation(baseOptions?: Apollo.MutationHookOptions<AddQuestionViewMutation, AddQuestionViewMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddQuestionViewMutation, AddQuestionViewMutationVariables>(AddQuestionViewDocument, options);
      }
export type AddQuestionViewMutationHookResult = ReturnType<typeof useAddQuestionViewMutation>;
export type AddQuestionViewMutationResult = Apollo.MutationResult<AddQuestionViewMutation>;
export type AddQuestionViewMutationOptions = Apollo.BaseMutationOptions<AddQuestionViewMutation, AddQuestionViewMutationVariables>;
export const AddQuestionVoteDocument = gql`
    mutation AddQuestionVote($questionId: Int!, $voteType: VoteType!) {
  addQuestionVote(questionId: $questionId, voteType: $voteType) {
    upVoteCount
    downVoteCount
    userVoteType
  }
}
    `;
export type AddQuestionVoteMutationFn = Apollo.MutationFunction<AddQuestionVoteMutation, AddQuestionVoteMutationVariables>;

/**
 * __useAddQuestionVoteMutation__
 *
 * To run a mutation, you first call `useAddQuestionVoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddQuestionVoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addQuestionVoteMutation, { data, loading, error }] = useAddQuestionVoteMutation({
 *   variables: {
 *      questionId: // value for 'questionId'
 *      voteType: // value for 'voteType'
 *   },
 * });
 */
export function useAddQuestionVoteMutation(baseOptions?: Apollo.MutationHookOptions<AddQuestionVoteMutation, AddQuestionVoteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddQuestionVoteMutation, AddQuestionVoteMutationVariables>(AddQuestionVoteDocument, options);
      }
export type AddQuestionVoteMutationHookResult = ReturnType<typeof useAddQuestionVoteMutation>;
export type AddQuestionVoteMutationResult = Apollo.MutationResult<AddQuestionVoteMutation>;
export type AddQuestionVoteMutationOptions = Apollo.BaseMutationOptions<AddQuestionVoteMutation, AddQuestionVoteMutationVariables>;
export const AddSentenceViewDocument = gql`
    mutation AddSentenceView($sentenceId: Int!) {
  addSentenceView(sentenceId: $sentenceId) {
    viewCount
  }
}
    `;
export type AddSentenceViewMutationFn = Apollo.MutationFunction<AddSentenceViewMutation, AddSentenceViewMutationVariables>;

/**
 * __useAddSentenceViewMutation__
 *
 * To run a mutation, you first call `useAddSentenceViewMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddSentenceViewMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addSentenceViewMutation, { data, loading, error }] = useAddSentenceViewMutation({
 *   variables: {
 *      sentenceId: // value for 'sentenceId'
 *   },
 * });
 */
export function useAddSentenceViewMutation(baseOptions?: Apollo.MutationHookOptions<AddSentenceViewMutation, AddSentenceViewMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddSentenceViewMutation, AddSentenceViewMutationVariables>(AddSentenceViewDocument, options);
      }
export type AddSentenceViewMutationHookResult = ReturnType<typeof useAddSentenceViewMutation>;
export type AddSentenceViewMutationResult = Apollo.MutationResult<AddSentenceViewMutation>;
export type AddSentenceViewMutationOptions = Apollo.BaseMutationOptions<AddSentenceViewMutation, AddSentenceViewMutationVariables>;
export const AddSentenceVoteDocument = gql`
    mutation AddSentenceVote($sentenceId: Int!, $voteType: VoteType!) {
  addSentenceVote(sentenceId: $sentenceId, voteType: $voteType) {
    upVoteCount
    downVoteCount
    userVoteType
  }
}
    `;
export type AddSentenceVoteMutationFn = Apollo.MutationFunction<AddSentenceVoteMutation, AddSentenceVoteMutationVariables>;

/**
 * __useAddSentenceVoteMutation__
 *
 * To run a mutation, you first call `useAddSentenceVoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddSentenceVoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addSentenceVoteMutation, { data, loading, error }] = useAddSentenceVoteMutation({
 *   variables: {
 *      sentenceId: // value for 'sentenceId'
 *      voteType: // value for 'voteType'
 *   },
 * });
 */
export function useAddSentenceVoteMutation(baseOptions?: Apollo.MutationHookOptions<AddSentenceVoteMutation, AddSentenceVoteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddSentenceVoteMutation, AddSentenceVoteMutationVariables>(AddSentenceVoteDocument, options);
      }
export type AddSentenceVoteMutationHookResult = ReturnType<typeof useAddSentenceVoteMutation>;
export type AddSentenceVoteMutationResult = Apollo.MutationResult<AddSentenceVoteMutation>;
export type AddSentenceVoteMutationOptions = Apollo.BaseMutationOptions<AddSentenceVoteMutation, AddSentenceVoteMutationVariables>;
export const ChangePasswordDocument = gql`
    mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
  changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
    ...UserResponse
  }
}
    ${UserResponseFragmentDoc}`;
export type ChangePasswordMutationFn = Apollo.MutationFunction<ChangePasswordMutation, ChangePasswordMutationVariables>;

/**
 * __useChangePasswordMutation__
 *
 * To run a mutation, you first call `useChangePasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangePasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changePasswordMutation, { data, loading, error }] = useChangePasswordMutation({
 *   variables: {
 *      oldPassword: // value for 'oldPassword'
 *      newPassword: // value for 'newPassword'
 *   },
 * });
 */
export function useChangePasswordMutation(baseOptions?: Apollo.MutationHookOptions<ChangePasswordMutation, ChangePasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ChangePasswordMutation, ChangePasswordMutationVariables>(ChangePasswordDocument, options);
      }
export type ChangePasswordMutationHookResult = ReturnType<typeof useChangePasswordMutation>;
export type ChangePasswordMutationResult = Apollo.MutationResult<ChangePasswordMutation>;
export type ChangePasswordMutationOptions = Apollo.BaseMutationOptions<ChangePasswordMutation, ChangePasswordMutationVariables>;
export const ChangePasswordWithTokenDocument = gql`
    mutation ChangePasswordWithToken($token: String!, $newPassword: String!) {
  changePasswordWithToken(token: $token, newPassword: $newPassword) {
    ...UserResponse
  }
}
    ${UserResponseFragmentDoc}`;
export type ChangePasswordWithTokenMutationFn = Apollo.MutationFunction<ChangePasswordWithTokenMutation, ChangePasswordWithTokenMutationVariables>;

/**
 * __useChangePasswordWithTokenMutation__
 *
 * To run a mutation, you first call `useChangePasswordWithTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangePasswordWithTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changePasswordWithTokenMutation, { data, loading, error }] = useChangePasswordWithTokenMutation({
 *   variables: {
 *      token: // value for 'token'
 *      newPassword: // value for 'newPassword'
 *   },
 * });
 */
export function useChangePasswordWithTokenMutation(baseOptions?: Apollo.MutationHookOptions<ChangePasswordWithTokenMutation, ChangePasswordWithTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ChangePasswordWithTokenMutation, ChangePasswordWithTokenMutationVariables>(ChangePasswordWithTokenDocument, options);
      }
export type ChangePasswordWithTokenMutationHookResult = ReturnType<typeof useChangePasswordWithTokenMutation>;
export type ChangePasswordWithTokenMutationResult = Apollo.MutationResult<ChangePasswordWithTokenMutation>;
export type ChangePasswordWithTokenMutationOptions = Apollo.BaseMutationOptions<ChangePasswordWithTokenMutation, ChangePasswordWithTokenMutationVariables>;
export const ChangeProfileDocument = gql`
    mutation ChangeProfile($email: String!, $firstName: String!, $lastName: String!) {
  changeProfile(email: $email, firstName: $firstName, lastName: $lastName) {
    ...UserResponse
  }
}
    ${UserResponseFragmentDoc}`;
export type ChangeProfileMutationFn = Apollo.MutationFunction<ChangeProfileMutation, ChangeProfileMutationVariables>;

/**
 * __useChangeProfileMutation__
 *
 * To run a mutation, you first call `useChangeProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangeProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changeProfileMutation, { data, loading, error }] = useChangeProfileMutation({
 *   variables: {
 *      email: // value for 'email'
 *      firstName: // value for 'firstName'
 *      lastName: // value for 'lastName'
 *   },
 * });
 */
export function useChangeProfileMutation(baseOptions?: Apollo.MutationHookOptions<ChangeProfileMutation, ChangeProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ChangeProfileMutation, ChangeProfileMutationVariables>(ChangeProfileDocument, options);
      }
export type ChangeProfileMutationHookResult = ReturnType<typeof useChangeProfileMutation>;
export type ChangeProfileMutationResult = Apollo.MutationResult<ChangeProfileMutation>;
export type ChangeProfileMutationOptions = Apollo.BaseMutationOptions<ChangeProfileMutation, ChangeProfileMutationVariables>;
export const CreateParagraphDocument = gql`
    mutation createParagraph($paragraphInput: ParagraphInput!, $cloningOriginId: Int) {
  createParagraph(
    paragraphInput: $paragraphInput
    cloningOriginId: $cloningOriginId
  ) {
    id
    text
    teacher {
      firstName
      lastName
    }
    children {
      id
      text
    }
    subjects
  }
}
    `;
export type CreateParagraphMutationFn = Apollo.MutationFunction<CreateParagraphMutation, CreateParagraphMutationVariables>;

/**
 * __useCreateParagraphMutation__
 *
 * To run a mutation, you first call `useCreateParagraphMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateParagraphMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createParagraphMutation, { data, loading, error }] = useCreateParagraphMutation({
 *   variables: {
 *      paragraphInput: // value for 'paragraphInput'
 *      cloningOriginId: // value for 'cloningOriginId'
 *   },
 * });
 */
export function useCreateParagraphMutation(baseOptions?: Apollo.MutationHookOptions<CreateParagraphMutation, CreateParagraphMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateParagraphMutation, CreateParagraphMutationVariables>(CreateParagraphDocument, options);
      }
export type CreateParagraphMutationHookResult = ReturnType<typeof useCreateParagraphMutation>;
export type CreateParagraphMutationResult = Apollo.MutationResult<CreateParagraphMutation>;
export type CreateParagraphMutationOptions = Apollo.BaseMutationOptions<CreateParagraphMutation, CreateParagraphMutationVariables>;
export const CreateQuestionDocument = gql`
    mutation CreateQuestion($questionInput: QuestionInput!) {
  createQuestion(questionInput: $questionInput) {
    id
    createdAt
    updatedAt
    question
    choices
    answer
    teacher {
      firstName
      lastName
    }
    upVoteCount
    downVoteCount
    viewCount
  }
}
    `;
export type CreateQuestionMutationFn = Apollo.MutationFunction<CreateQuestionMutation, CreateQuestionMutationVariables>;

/**
 * __useCreateQuestionMutation__
 *
 * To run a mutation, you first call `useCreateQuestionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateQuestionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createQuestionMutation, { data, loading, error }] = useCreateQuestionMutation({
 *   variables: {
 *      questionInput: // value for 'questionInput'
 *   },
 * });
 */
export function useCreateQuestionMutation(baseOptions?: Apollo.MutationHookOptions<CreateQuestionMutation, CreateQuestionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateQuestionMutation, CreateQuestionMutationVariables>(CreateQuestionDocument, options);
      }
export type CreateQuestionMutationHookResult = ReturnType<typeof useCreateQuestionMutation>;
export type CreateQuestionMutationResult = Apollo.MutationResult<CreateQuestionMutation>;
export type CreateQuestionMutationOptions = Apollo.BaseMutationOptions<CreateQuestionMutation, CreateQuestionMutationVariables>;
export const CreateQuestionReviewDocument = gql`
    mutation CreateQuestionReview($questionId: Int!, $reviewStatus: ReviewStatus!) {
  createQuestionReview(questionId: $questionId, reviewStatus: $reviewStatus) {
    questionId
    reviewStatus
    dateCreated
    dateUpdated
    dateNextAvailable
    question {
      question
      subjects
    }
  }
}
    `;
export type CreateQuestionReviewMutationFn = Apollo.MutationFunction<CreateQuestionReviewMutation, CreateQuestionReviewMutationVariables>;

/**
 * __useCreateQuestionReviewMutation__
 *
 * To run a mutation, you first call `useCreateQuestionReviewMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateQuestionReviewMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createQuestionReviewMutation, { data, loading, error }] = useCreateQuestionReviewMutation({
 *   variables: {
 *      questionId: // value for 'questionId'
 *      reviewStatus: // value for 'reviewStatus'
 *   },
 * });
 */
export function useCreateQuestionReviewMutation(baseOptions?: Apollo.MutationHookOptions<CreateQuestionReviewMutation, CreateQuestionReviewMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateQuestionReviewMutation, CreateQuestionReviewMutationVariables>(CreateQuestionReviewDocument, options);
      }
export type CreateQuestionReviewMutationHookResult = ReturnType<typeof useCreateQuestionReviewMutation>;
export type CreateQuestionReviewMutationResult = Apollo.MutationResult<CreateQuestionReviewMutation>;
export type CreateQuestionReviewMutationOptions = Apollo.BaseMutationOptions<CreateQuestionReviewMutation, CreateQuestionReviewMutationVariables>;
export const DeleteParagraphDocument = gql`
    mutation DeleteParagraph($id: Int!) {
  deleteParagraph(id: $id)
}
    `;
export type DeleteParagraphMutationFn = Apollo.MutationFunction<DeleteParagraphMutation, DeleteParagraphMutationVariables>;

/**
 * __useDeleteParagraphMutation__
 *
 * To run a mutation, you first call `useDeleteParagraphMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteParagraphMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteParagraphMutation, { data, loading, error }] = useDeleteParagraphMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteParagraphMutation(baseOptions?: Apollo.MutationHookOptions<DeleteParagraphMutation, DeleteParagraphMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteParagraphMutation, DeleteParagraphMutationVariables>(DeleteParagraphDocument, options);
      }
export type DeleteParagraphMutationHookResult = ReturnType<typeof useDeleteParagraphMutation>;
export type DeleteParagraphMutationResult = Apollo.MutationResult<DeleteParagraphMutation>;
export type DeleteParagraphMutationOptions = Apollo.BaseMutationOptions<DeleteParagraphMutation, DeleteParagraphMutationVariables>;
export const DeleteQuestionDocument = gql`
    mutation DeleteQuestion($id: Int!) {
  deleteQuestion(id: $id)
}
    `;
export type DeleteQuestionMutationFn = Apollo.MutationFunction<DeleteQuestionMutation, DeleteQuestionMutationVariables>;

/**
 * __useDeleteQuestionMutation__
 *
 * To run a mutation, you first call `useDeleteQuestionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteQuestionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteQuestionMutation, { data, loading, error }] = useDeleteQuestionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteQuestionMutation(baseOptions?: Apollo.MutationHookOptions<DeleteQuestionMutation, DeleteQuestionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteQuestionMutation, DeleteQuestionMutationVariables>(DeleteQuestionDocument, options);
      }
export type DeleteQuestionMutationHookResult = ReturnType<typeof useDeleteQuestionMutation>;
export type DeleteQuestionMutationResult = Apollo.MutationResult<DeleteQuestionMutation>;
export type DeleteQuestionMutationOptions = Apollo.BaseMutationOptions<DeleteQuestionMutation, DeleteQuestionMutationVariables>;
export const DeleteQuestionReviewDocument = gql`
    mutation DeleteQuestionReview($questionId: Int!) {
  deleteQuestionReview(questionId: $questionId)
}
    `;
export type DeleteQuestionReviewMutationFn = Apollo.MutationFunction<DeleteQuestionReviewMutation, DeleteQuestionReviewMutationVariables>;

/**
 * __useDeleteQuestionReviewMutation__
 *
 * To run a mutation, you first call `useDeleteQuestionReviewMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteQuestionReviewMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteQuestionReviewMutation, { data, loading, error }] = useDeleteQuestionReviewMutation({
 *   variables: {
 *      questionId: // value for 'questionId'
 *   },
 * });
 */
export function useDeleteQuestionReviewMutation(baseOptions?: Apollo.MutationHookOptions<DeleteQuestionReviewMutation, DeleteQuestionReviewMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteQuestionReviewMutation, DeleteQuestionReviewMutationVariables>(DeleteQuestionReviewDocument, options);
      }
export type DeleteQuestionReviewMutationHookResult = ReturnType<typeof useDeleteQuestionReviewMutation>;
export type DeleteQuestionReviewMutationResult = Apollo.MutationResult<DeleteQuestionReviewMutation>;
export type DeleteQuestionReviewMutationOptions = Apollo.BaseMutationOptions<DeleteQuestionReviewMutation, DeleteQuestionReviewMutationVariables>;
export const DeleteUserDocument = gql`
    mutation DeleteUser {
  deleteUser
}
    `;
export type DeleteUserMutationFn = Apollo.MutationFunction<DeleteUserMutation, DeleteUserMutationVariables>;

/**
 * __useDeleteUserMutation__
 *
 * To run a mutation, you first call `useDeleteUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteUserMutation, { data, loading, error }] = useDeleteUserMutation({
 *   variables: {
 *   },
 * });
 */
export function useDeleteUserMutation(baseOptions?: Apollo.MutationHookOptions<DeleteUserMutation, DeleteUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteUserMutation, DeleteUserMutationVariables>(DeleteUserDocument, options);
      }
export type DeleteUserMutationHookResult = ReturnType<typeof useDeleteUserMutation>;
export type DeleteUserMutationResult = Apollo.MutationResult<DeleteUserMutation>;
export type DeleteUserMutationOptions = Apollo.BaseMutationOptions<DeleteUserMutation, DeleteUserMutationVariables>;
export const ForgotPasswordDocument = gql`
    mutation ForgotPassword($email: String!) {
  forgotPassword(email: $email)
}
    `;
export type ForgotPasswordMutationFn = Apollo.MutationFunction<ForgotPasswordMutation, ForgotPasswordMutationVariables>;

/**
 * __useForgotPasswordMutation__
 *
 * To run a mutation, you first call `useForgotPasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useForgotPasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [forgotPasswordMutation, { data, loading, error }] = useForgotPasswordMutation({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useForgotPasswordMutation(baseOptions?: Apollo.MutationHookOptions<ForgotPasswordMutation, ForgotPasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ForgotPasswordMutation, ForgotPasswordMutationVariables>(ForgotPasswordDocument, options);
      }
export type ForgotPasswordMutationHookResult = ReturnType<typeof useForgotPasswordMutation>;
export type ForgotPasswordMutationResult = Apollo.MutationResult<ForgotPasswordMutation>;
export type ForgotPasswordMutationOptions = Apollo.BaseMutationOptions<ForgotPasswordMutation, ForgotPasswordMutationVariables>;
export const LoginDocument = gql`
    mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    ...UserResponse
  }
}
    ${UserResponseFragmentDoc}`;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = gql`
    mutation Logout {
  logout
}
    `;
export type LogoutMutationFn = Apollo.MutationFunction<LogoutMutation, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *   },
 * });
 */
export function useLogoutMutation(baseOptions?: Apollo.MutationHookOptions<LogoutMutation, LogoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument, options);
      }
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = Apollo.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = Apollo.BaseMutationOptions<LogoutMutation, LogoutMutationVariables>;
export const RegisterDocument = gql`
    mutation Register($options: RegisterUserInputs!) {
  register(options: $options) {
    ...UserResponse
  }
}
    ${UserResponseFragmentDoc}`;
export type RegisterMutationFn = Apollo.MutationFunction<RegisterMutation, RegisterMutationVariables>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      options: // value for 'options'
 *   },
 * });
 */
export function useRegisterMutation(baseOptions?: Apollo.MutationHookOptions<RegisterMutation, RegisterMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument, options);
      }
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = Apollo.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = Apollo.BaseMutationOptions<RegisterMutation, RegisterMutationVariables>;
export const UpdateParagraphDocument = gql`
    mutation UpdateParagraph($id: Int!, $paragraphInput: ParagraphInput!) {
  updateParagraph(id: $id, paragraphInput: $paragraphInput) {
    id
    text
    teacher {
      firstName
      lastName
    }
    children {
      id
      text
    }
    subjects
  }
}
    `;
export type UpdateParagraphMutationFn = Apollo.MutationFunction<UpdateParagraphMutation, UpdateParagraphMutationVariables>;

/**
 * __useUpdateParagraphMutation__
 *
 * To run a mutation, you first call `useUpdateParagraphMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateParagraphMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateParagraphMutation, { data, loading, error }] = useUpdateParagraphMutation({
 *   variables: {
 *      id: // value for 'id'
 *      paragraphInput: // value for 'paragraphInput'
 *   },
 * });
 */
export function useUpdateParagraphMutation(baseOptions?: Apollo.MutationHookOptions<UpdateParagraphMutation, UpdateParagraphMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateParagraphMutation, UpdateParagraphMutationVariables>(UpdateParagraphDocument, options);
      }
export type UpdateParagraphMutationHookResult = ReturnType<typeof useUpdateParagraphMutation>;
export type UpdateParagraphMutationResult = Apollo.MutationResult<UpdateParagraphMutation>;
export type UpdateParagraphMutationOptions = Apollo.BaseMutationOptions<UpdateParagraphMutation, UpdateParagraphMutationVariables>;
export const UpdateQuestionDocument = gql`
    mutation UpdateQuestion($id: Int!, $questionInput: QuestionInput!) {
  updateQuestion(id: $id, questionInput: $questionInput) {
    id
    createdAt
    updatedAt
    question
    choices
    answer
    teacher {
      firstName
      lastName
    }
    upVoteCount
    downVoteCount
    viewCount
  }
}
    `;
export type UpdateQuestionMutationFn = Apollo.MutationFunction<UpdateQuestionMutation, UpdateQuestionMutationVariables>;

/**
 * __useUpdateQuestionMutation__
 *
 * To run a mutation, you first call `useUpdateQuestionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateQuestionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateQuestionMutation, { data, loading, error }] = useUpdateQuestionMutation({
 *   variables: {
 *      id: // value for 'id'
 *      questionInput: // value for 'questionInput'
 *   },
 * });
 */
export function useUpdateQuestionMutation(baseOptions?: Apollo.MutationHookOptions<UpdateQuestionMutation, UpdateQuestionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateQuestionMutation, UpdateQuestionMutationVariables>(UpdateQuestionDocument, options);
      }
export type UpdateQuestionMutationHookResult = ReturnType<typeof useUpdateQuestionMutation>;
export type UpdateQuestionMutationResult = Apollo.MutationResult<UpdateQuestionMutation>;
export type UpdateQuestionMutationOptions = Apollo.BaseMutationOptions<UpdateQuestionMutation, UpdateQuestionMutationVariables>;
export const UpdateQuestionReviewDocument = gql`
    mutation UpdateQuestionReview($questionId: Int!, $reviewStatus: ReviewStatus!) {
  updateQuestionReview(questionId: $questionId, reviewStatus: $reviewStatus) {
    questionId
    reviewStatus
    dateCreated
    dateUpdated
    dateNextAvailable
    question {
      question
      subjects
    }
  }
}
    `;
export type UpdateQuestionReviewMutationFn = Apollo.MutationFunction<UpdateQuestionReviewMutation, UpdateQuestionReviewMutationVariables>;

/**
 * __useUpdateQuestionReviewMutation__
 *
 * To run a mutation, you first call `useUpdateQuestionReviewMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateQuestionReviewMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateQuestionReviewMutation, { data, loading, error }] = useUpdateQuestionReviewMutation({
 *   variables: {
 *      questionId: // value for 'questionId'
 *      reviewStatus: // value for 'reviewStatus'
 *   },
 * });
 */
export function useUpdateQuestionReviewMutation(baseOptions?: Apollo.MutationHookOptions<UpdateQuestionReviewMutation, UpdateQuestionReviewMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateQuestionReviewMutation, UpdateQuestionReviewMutationVariables>(UpdateQuestionReviewDocument, options);
      }
export type UpdateQuestionReviewMutationHookResult = ReturnType<typeof useUpdateQuestionReviewMutation>;
export type UpdateQuestionReviewMutationResult = Apollo.MutationResult<UpdateQuestionReviewMutation>;
export type UpdateQuestionReviewMutationOptions = Apollo.BaseMutationOptions<UpdateQuestionReviewMutation, UpdateQuestionReviewMutationVariables>;
export const MeDocument = gql`
    query Me {
  me {
    ...User
  }
}
    ${UserFragmentDoc}`;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: Apollo.QueryHookOptions<MeQuery, MeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
      }
export function useMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const QuestionDocument = gql`
    query Question($id: Int!) {
  question(id: $id) {
    id
    question
    questionType
    choices
    answer
    teacherId
    teacher {
      firstName
      lastName
    }
    sentence {
      id
      text
    }
    subjects
    upVoteCount
    downVoteCount
    userVoteType
    viewCount
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useQuestionQuery__
 *
 * To run a query within a React component, call `useQuestionQuery` and pass it any options that fit your needs.
 * When your component renders, `useQuestionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useQuestionQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useQuestionQuery(baseOptions: Apollo.QueryHookOptions<QuestionQuery, QuestionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<QuestionQuery, QuestionQueryVariables>(QuestionDocument, options);
      }
export function useQuestionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<QuestionQuery, QuestionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<QuestionQuery, QuestionQueryVariables>(QuestionDocument, options);
        }
export type QuestionQueryHookResult = ReturnType<typeof useQuestionQuery>;
export type QuestionLazyQueryHookResult = ReturnType<typeof useQuestionLazyQuery>;
export type QuestionQueryResult = Apollo.QueryResult<QuestionQuery, QuestionQueryVariables>;
export const QuestionReviewDocument = gql`
    query QuestionReview($questionId: Int!) {
  questionReview(questionId: $questionId) {
    reviewStatus
    dateCreated
    dateUpdated
    dateNextAvailable
  }
}
    `;

/**
 * __useQuestionReviewQuery__
 *
 * To run a query within a React component, call `useQuestionReviewQuery` and pass it any options that fit your needs.
 * When your component renders, `useQuestionReviewQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useQuestionReviewQuery({
 *   variables: {
 *      questionId: // value for 'questionId'
 *   },
 * });
 */
export function useQuestionReviewQuery(baseOptions: Apollo.QueryHookOptions<QuestionReviewQuery, QuestionReviewQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<QuestionReviewQuery, QuestionReviewQueryVariables>(QuestionReviewDocument, options);
      }
export function useQuestionReviewLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<QuestionReviewQuery, QuestionReviewQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<QuestionReviewQuery, QuestionReviewQueryVariables>(QuestionReviewDocument, options);
        }
export type QuestionReviewQueryHookResult = ReturnType<typeof useQuestionReviewQuery>;
export type QuestionReviewLazyQueryHookResult = ReturnType<typeof useQuestionReviewLazyQuery>;
export type QuestionReviewQueryResult = Apollo.QueryResult<QuestionReviewQuery, QuestionReviewQueryVariables>;
export const QuestionsDocument = gql`
    query Questions($limit: Int!, $cursor: String) {
  questions(limit: $limit, cursor: $cursor) {
    hasMore
    questions {
      id
      question
      questionType
      choices
      answer
      teacher {
        firstName
        lastName
      }
      subjects
      upVoteCount
      downVoteCount
      userVoteType
      viewCount
      createdAt
    }
  }
}
    `;

/**
 * __useQuestionsQuery__
 *
 * To run a query within a React component, call `useQuestionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useQuestionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useQuestionsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      cursor: // value for 'cursor'
 *   },
 * });
 */
export function useQuestionsQuery(baseOptions: Apollo.QueryHookOptions<QuestionsQuery, QuestionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<QuestionsQuery, QuestionsQueryVariables>(QuestionsDocument, options);
      }
export function useQuestionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<QuestionsQuery, QuestionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<QuestionsQuery, QuestionsQueryVariables>(QuestionsDocument, options);
        }
export type QuestionsQueryHookResult = ReturnType<typeof useQuestionsQuery>;
export type QuestionsLazyQueryHookResult = ReturnType<typeof useQuestionsLazyQuery>;
export type QuestionsQueryResult = Apollo.QueryResult<QuestionsQuery, QuestionsQueryVariables>;
export const SentenceDocument = gql`
    query Sentence($id: Int!) {
  sentence(id: $id) {
    id
    text
    subjects
    upVoteCount
    downVoteCount
    userVoteType
    viewCount
    createdAt
    updatedAt
    teacherId
    teacher {
      firstName
      lastName
    }
    children {
      id
      text
      teacher {
        firstName
        lastName
      }
      upVoteCount
      downVoteCount
      children {
        id
        text
      }
      orderNumber
    }
    parent {
      id
      text
      teacher {
        firstName
        lastName
      }
      subjects
      upVoteCount
      downVoteCount
      viewCount
      createdAt
      children {
        id
        text
      }
    }
    orderNumber
    clones {
      id
      text
      questions {
        id
        question
        subjects
      }
      parent {
        id
        text
        teacher {
          firstName
          lastName
        }
        children {
          text
          orderNumber
        }
      }
      subjects
      teacherId
      teacher {
        id
        firstName
        lastName
      }
      upVoteCount
      downVoteCount
      userVoteType
      viewCount
      createdAt
      children {
        id
        text
        teacher {
          firstName
          lastName
        }
        children {
          id
          text
        }
        clones {
          id
          text
          teacher {
            firstName
            lastName
          }
          children {
            id
            text
          }
        }
      }
      orderNumber
    }
    questions {
      id
      question
      subjects
    }
  }
}
    `;

/**
 * __useSentenceQuery__
 *
 * To run a query within a React component, call `useSentenceQuery` and pass it any options that fit your needs.
 * When your component renders, `useSentenceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSentenceQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useSentenceQuery(baseOptions: Apollo.QueryHookOptions<SentenceQuery, SentenceQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SentenceQuery, SentenceQueryVariables>(SentenceDocument, options);
      }
export function useSentenceLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SentenceQuery, SentenceQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SentenceQuery, SentenceQueryVariables>(SentenceDocument, options);
        }
export type SentenceQueryHookResult = ReturnType<typeof useSentenceQuery>;
export type SentenceLazyQueryHookResult = ReturnType<typeof useSentenceLazyQuery>;
export type SentenceQueryResult = Apollo.QueryResult<SentenceQuery, SentenceQueryVariables>;
export const SentencesDocument = gql`
    query Sentences($limit: Int!, $cursor: String) {
  sentences(limit: $limit, cursor: $cursor) {
    sentences {
      id
      text
      subjects
      teacher {
        firstName
        lastName
      }
      children {
        text
      }
      upVoteCount
      downVoteCount
      userVoteType
      viewCount
      createdAt
    }
    hasMore
  }
}
    `;

/**
 * __useSentencesQuery__
 *
 * To run a query within a React component, call `useSentencesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSentencesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSentencesQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      cursor: // value for 'cursor'
 *   },
 * });
 */
export function useSentencesQuery(baseOptions: Apollo.QueryHookOptions<SentencesQuery, SentencesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SentencesQuery, SentencesQueryVariables>(SentencesDocument, options);
      }
export function useSentencesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SentencesQuery, SentencesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SentencesQuery, SentencesQueryVariables>(SentencesDocument, options);
        }
export type SentencesQueryHookResult = ReturnType<typeof useSentencesQuery>;
export type SentencesLazyQueryHookResult = ReturnType<typeof useSentencesLazyQuery>;
export type SentencesQueryResult = Apollo.QueryResult<SentencesQuery, SentencesQueryVariables>;