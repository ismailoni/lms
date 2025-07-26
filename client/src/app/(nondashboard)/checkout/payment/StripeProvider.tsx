import React, { useEffect, useState } from 'react';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Appearance, StripeElementsOptions } from "@stripe/stripe-js";
import { useCreateStripePaymentIntentMutation } from '@/state/api';
import { useCurrentCourse } from '@/hooks/useCurrentCourse';
import { useUser } from '@clerk/nextjs';
import Loading from '@/components/Loading';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
  throw new Error("Stripe public key is not defined in the environment variables.");
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const appearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#0570de',
    colorBackground: '#18181b',
    colorText: '#d2d2d2',
    colorDanger: '#df1b41',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '3px',
    borderRadius: '10px',
    fontSizeBase: '14px',
  },
};

const StripeProvider = ({ children }: { children: React.ReactNode }) => {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [createStripePaymentIntent] = useCreateStripePaymentIntentMutation();
  const { course } = useCurrentCourse();
  const { user } = useUser();

  useEffect(() => {
    if (!course?.price || !user?.id) return;

    const fetchPaymentIntent = async () => {
      try {
        setError("");

        const amount = Number(course.price);
        if (isNaN(amount) || amount <= 0) {
          setError("Invalid course price.");
          return;
        }

        console.log("Requesting PaymentIntent for:", {
          amount,
          courseId: course.courseId,
          userId: user.id
        });

        const result = await createStripePaymentIntent({
          amount,
          courseId: course.courseId,
          userId: user.id,
        }).unwrap();

        if (result.clientSecret) {
          console.log("Received clientSecret:", result.clientSecret);
          setClientSecret(result.clientSecret);
        } else {
          setError("Failed to create payment intent.");
        }
      } catch (err: any) {
        console.error("Failed to create payment intent:", err);
        setError(err?.data?.message || "Failed to initialize payment.");
      }
    };

    fetchPaymentIntent();
  }, [course, user, createStripePaymentIntent]);

  if (error) {
    return (
      <div className="payment-error">
        <p>Payment initialization failed: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!clientSecret) return <Loading />;

  const options: StripeElementsOptions = { clientSecret, appearance };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
