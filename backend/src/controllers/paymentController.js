import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay Instance
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TNzWh33ofECeVl';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'KcEVKfAu3z3q3K7fhxEmA0lq';


  return {
    key_id,
    key_secret,
    instance: new Razorpay({
      key_id,
      key_secret,
    }),
  };
};

// @desc    Create Razorpay Order ID
// @route   POST /api/payment/razorpay/create-order
// @access  Public / User
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const { key_id, instance } = getRazorpayInstance();

    // Convert amount to paise (1 INR = 100 Paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        platform: 'OmniCart E-Commerce',
      },
    };

    try {
      const razorpayOrder = await instance.orders.create(options);
      return res.json({
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: key_id,
        simulated: false,
        message: 'Razorpay Order ID generated successfully',
      });
    } catch (apiError) {
      console.error('Razorpay Order Creation API Error:', apiError);
      return res.status(500).json({
        message: apiError?.error?.description || apiError?.message || 'Razorpay Order Creation Failed',
        errorDetails: apiError,
      });
    }

  } catch (error) {
    res.status(500).json({ message: error.message || 'Error generating Razorpay Order ID' });
  }
};

// @desc    Verify Razorpay HMAC Signature
// @route   POST /api/payment/razorpay/verify-signature
// @access  Public / User
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ message: 'Missing Razorpay order or payment parameters' });
    }

    const { key_secret } = getRazorpayInstance();

    if (razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const isSignatureValid = generatedSignature === razorpay_signature;

      return res.json({
        success: true,
        isSignatureValid,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        message: 'Razorpay Payment Signature Processed',
      });
    }

    res.json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      message: 'Razorpay Payment Verified Successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify Razorpay signature' });
  }
};
