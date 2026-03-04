// For Vercel serverless functions
const Razorpay = require('razorpay');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const razorpay = new Razorpay({
            key_id: process.env.rzp_test_SKFKFN7AccQJl1,
            key_secret: process.env.62nY6hfTTMIygeJnXsvl2f8V,
        });

        const options = {
            amount: req.body.amount,
            currency: req.body.currency || 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
