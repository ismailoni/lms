"use client";
import CoursePreview from "@/components/CoursePreview";
import { CustomFormField } from "@/components/CustomFormField";
import Loading from "@/components/Loading";
import SigninComponent from "@/components/Signin";
import SignupComponent from "@/components/Signup";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useCurrentCourse } from "@/hooks/useCurrentCourse";
import { GuestFormData, guestSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import React, { Suspense } from "react";

const CheckoutDetailsPageContent = () => {
  const { course: selectedCourse, isLoading, isError } = useCurrentCourse();
  const searchParams = useSearchParams();
  const showSignUp = searchParams.get("showSignUp") === "true";

  const methods = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      email: "",
    },
  });

  if (isLoading) return <Loading />;
  if (isError) return <div>Failed to fetch course data</div>;
  if (!selectedCourse) return <div>Course not found.</div>;

  return (
    <div className="checkout-details">
      <div className="checkout-details__container">
        <div className="checkout-details__preview">
          <CoursePreview course={selectedCourse} />
        </div>

        {/* STRETCH FEATURE */}
        <div className="checkout-details__options">
          <div className="checkout-details__guest">
            <h2 className="checkout-details__title">Guest Checkout</h2>
            <p className="checkout-details__subtitle">
              Enter email to recieve course access details and order
              confirmation. You can also sign up for an account after checkout.
            </p>
            <Form {...methods}>
              <form
                onSubmit={methods.handleSubmit((data) => {
                  console.log(data);
                })}
                className="checkout-details__form"
              >
                <CustomFormField
                  name="email"
                  label="Email Address"
                  placeholder="Enter your email address"
                  type="email"
                  labelClassName="font-normal text-white-50"
                  inputClassName="py-3"
                  className="w-full rounded mt-4"
                />
                <Button type="submit" className="checkout-details__submit">
                  Checkout as Guest
                </Button>
              </form>
            </Form>
          </div>

          <div className="checkout-details__divider">
            <hr className="checkout-details__divider-line" />
            <span className="checkout-details__divider-text">Or</span>
            <hr className="checkout-details__divider-line" />
          </div>

          <div className="checkout-details__auth">
            {showSignUp ? <SignupComponent /> : <SigninComponent />}
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutDetailsPage = () => (
  <Suspense fallback={<Loading />}>
    <CheckoutDetailsPageContent />
  </Suspense>
);

export default CheckoutDetailsPage;
