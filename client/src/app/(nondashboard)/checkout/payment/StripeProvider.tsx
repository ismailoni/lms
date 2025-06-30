import React, { useEffect, useState } from 'react'
import { Elements } from "@stripe/react-stripe-js";
import { Appearance, loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { useCreateStripePaymentIntentMutation } from '@/state/api';
import { useCurrentCourse } from '@/hooks/useCurrentCourse';
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

    const [clientSecret, setClientSecret] = useState<string | "">("");
    const [createStripePaymentIntent] = useCreateStripePaymentIntentMutation();
    const {course} = useCurrentCourse();

    useEffect(() => {
        if (!course) return;
        const fetchPaymentIntent = async () => {
            const result = await createStripePaymentIntent({
                amount: course?.price ?? 99999999999, 
            }).unwrap();

            setClientSecret(result.clientSecret);
        }
        fetchPaymentIntent();
    }, [course, createStripePaymentIntent, course?.price]);

    const options: StripeElementsOptions = {
        clientSecret,
        appearance,
    };

    if (!clientSecret) return <Loading />
  return (
    <Elements stripe={stripePromise} options={options}>
        {children}
    </Elements>
  )
}

export default StripeProvider