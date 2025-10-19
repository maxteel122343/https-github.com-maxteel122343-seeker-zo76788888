import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    console.log('Webhook event received:', event.type);

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const credits = parseInt(session.metadata?.credits || '0');
      const plan = session.metadata?.plan;
      const amount = session.amount_total ? session.amount_total / 100 : 0;

      if (!userId) {
        console.error('No user ID found in session metadata');
        return new Response(JSON.stringify({ error: 'No user ID' }), { status: 400 });
      }

      console.log(`Processing payment for user ${userId}: ${credits} credits, plan: ${plan}`);

      // Insert transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          stripe_session_id: session.id,
          stripe_payment_id: session.payment_intent as string,
          amount,
          credits_purchased: credits,
          plan_purchased: plan,
          status: 'completed',
        });

      if (transactionError) {
        console.error('Error inserting transaction:', transactionError);
        throw transactionError;
      }

      // Add credits using the database function
      const { error: creditsError } = await supabase.rpc('add_credits_after_payment', {
        p_user_id: userId,
        p_credits: credits,
        p_plan: plan,
      });

      if (creditsError) {
        console.error('Error adding credits:', creditsError);
        throw creditsError;
      }

      console.log(`Successfully added ${credits} credits to user ${userId}`);
    }

    // Handle failed payment
    if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;

      if (userId) {
        await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            credits_purchased: 0,
            status: 'failed',
          });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
