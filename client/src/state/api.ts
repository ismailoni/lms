import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BaseQueryApi, FetchArgs } from "@reduxjs/toolkit/query";
import { User } from "@clerk/nextjs/server";
import { toast } from "sonner";

// Extend the Window interface to include Clerk
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | undefined>;
      };
    };
  }
}

const customBaseQuery = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: Record<string, unknown> = {}
) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/",
    prepareHeaders: async (headers) => {
      const token = await window.Clerk?.session?.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  });

  try {
    const result = await baseQuery(args, api, extraOptions);

    if (result.error) {
      const errorData =
        typeof result.error === "object" && result.error !== null && "data" in result.error
          ? (result.error as { data?: unknown }).data
          : undefined;
      const errorMessage =
        (errorData && typeof errorData === "object" && "message" in errorData
          ? (errorData as { message?: string }).message
          : undefined) ||
        (typeof result.error === "object" && result.error !== null && "status" in result.error
          ? (result.error as { status?: unknown }).status?.toString()
          : undefined) ||
        "An error occurred";
      toast.error(`Error: ${errorMessage}`);
    }

    const isMutationRequest =
      (args as FetchArgs).method && (args as FetchArgs).method !== "GET";

    if (isMutationRequest) {
      const successMessage =
        result.data && typeof result.data === "object" && "message" in result.data
          ? (result.data as { message?: string }).message
          : undefined;
      if (successMessage) toast.success(successMessage);
    }

    // Only unwrap result.data.data if it actually exists
    if (
      result.data &&
      typeof result.data === "object" &&
      result.data !== null &&
      "data" in result.data
    ) {
      result.data = (result.data as { data: unknown }).data;
    }

    if (result.error?.status === 204 || result.meta?.response?.status === 204) {
      return { data: null };
    }

    return result;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    return { error: { status: "FETCH_ERROR", error: errorMessage } };
  }
};

export const api = createApi({
  baseQuery: customBaseQuery,
  reducerPath: "api",
  tagTypes: ["Courses", "Users", "UserCourseProgress"],
  endpoints: (build) => ({
    /**
     * Users Endpoints
     */
    updateUser: build.mutation<User, Partial<User> & { userId: string }>({
      query: ({ userId, ...updatedUser }) => ({
        url: `users/clerk/${userId}`,
        method: "PUT",
        body: updatedUser,
      }),
      invalidatesTags: ["Users"],
    }),

    /**
     * Courses Endpoints
     */

    getCourses: build.query<Course[], { category?: string }>({
      query: ({ category }) => ({
        url: `courses`,
        params: { category },
      }),
      providesTags: ["Courses"],
    }),

    getTeacherCourses: build.query<Course[], string>({
      query: () => ({
        url: `/courses/teacher-courses`,
      }),
      providesTags: ["Courses"],
    }),

    getCourse: build.query<Course, string>({
      query: (id) => `courses/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Courses", id }],
    }),

    createCourse: build.mutation<
      Course,
      { teacherId: string; teacherName: string }
    >({
      query: (body) => ({
        url: `courses`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Courses"],
    }),

    updateCourse: build.mutation<
      Course,
      { courseId: string; formData: FormData }
    >({
      query: ({ courseId, formData }) => ({
        url: `courses/${courseId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: "Courses", id: courseId },
      ],
      async onQueryStarted({ courseId }, { queryFulfilled }) {
        try {
          console.log("Starting course update mutation for courseId:", courseId);
          const result = await queryFulfilled;
          console.log("Course update successful:", result);
        } catch (error) {
          console.error("Course update failed:", error);
        }
      },
    }),

    deleteCourse: build.mutation<{ message: string }, string>({
      query: (courseId) => ({
        url: `courses/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Courses"],
    }),

    getUploadVideoUrl: build.mutation<
      { uploadUrl: string; videoUrl: string; uploadParams: Record<string, string> },
      {
        courseId: string;
        chapterId: string;
        sectionId: string;
        fileName: string;
        fileType: string;
      }
    >({
      query: ({ courseId, sectionId, chapterId, fileName, fileType }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/get-upload-url`,
        method: "POST",
        body: { fileName, fileType },
      }),
    }),



    /**
     * Transactions Endpoints
     */
    getTransactions: build.query<Transaction[], string>({
      query: (userId) => `transactions?userId=${userId}`,
    }),

    getTeacherEarningsBreakdown: build.query<
      {
        breakdown: {
          courseId: string;
          title: string;
          enrollCount: number;
          earnings: number;
        }[];
        totalEarnings: number;
        currency: string;
      },
      string
    >({
      query: (teacherId) => `teachers/${teacherId}/earnings/breakdown`,
    }),

    createStripePaymentIntent: build.mutation<
      { clientSecret: string },
      { amount: number; courseId: string; userId: string }
    >({
      query: ({ amount, courseId, userId }) => ({
        url: "transactions/stripe/payment-intent",
        method: "POST",
        body: { amount, courseId, userId },
      }),
    }),

    createTransaction: build.mutation<Transaction, Partial<Transaction>>({
      query: (transaction) => ({
        url: "transactions",
        method: "POST",
        body: transaction,
      }),
      invalidatesTags: ["Courses"], // This will refresh course data including enrollments
    }),

    getUserEnrolledCourses: build.query<Course[], string>({
      query: (userId) => `${userId}/enrolled-courses`,
      providesTags: ["Courses", "UserCourseProgress"],
      transformResponse: (response: Course[]) => {
        // Ensure enrollments is always an array
        return response.map(course => ({
          ...course,
          enrollments: course.enrollments || []
        }));
      },
    }),

    getUserCourseProgress: build.query<
      UserCourseProgress,
      { userId: string; courseId: string }
    >({
      query: ({ userId, courseId }) => `${userId}/courses/${courseId}`,
      providesTags: ["UserCourseProgress"],
    }),

    updateUserCourseProgress: build.mutation<
      UserCourseProgress,
      {
        userId: string;
        courseId: string;
        progressData: {
          sections: SectionProgress[];
        };
      }
    >({
      query: ({ userId, courseId, progressData }) => ({
        url: `${userId}/courses/${courseId}`,
        method: "PUT",
        body: progressData,
      }),
      invalidatesTags: ["UserCourseProgress"],
      async onQueryStarted(
        { userId, courseId, progressData },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            "getUserCourseProgress",
            { userId, courseId },
            (draft) => {
              Object.assign(draft, {
                ...draft,
                sections: progressData.sections,
              });
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useUpdateUserMutation,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetCoursesQuery,
  useGetTeacherCoursesQuery,
  useGetCourseQuery,
  useGetUploadVideoUrlMutation,
  useGetTransactionsQuery,
  useGetTeacherEarningsBreakdownQuery,
  useCreateTransactionMutation,
  useCreateStripePaymentIntentMutation,
  useGetUserEnrolledCoursesQuery,
  useGetUserCourseProgressQuery,
  useUpdateUserCourseProgressMutation,
} = api;
