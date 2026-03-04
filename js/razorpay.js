// Razorpay Payment Handler
const razorpayHandler = {
    key: 'rzp_test_SKFKFN7AccQJl1', // Get from dashboard

    async initializePayment(amount, planId, onSuccess, onFailure) {
        try {
            // Create order on your backend (you'll need a simple server endpoint)
            const orderResponse = await fetch('/api/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: amount * 100, // Convert to paise
                    currency: 'INR',
                    planId: planId
                })
            });
            
            const order = await orderResponse.json();

            const options = {
                key: this.key,
                amount: order.amount,
                currency: order.currency,
                name: 'HealthCareer',
                description: `${planId} Plan Subscription`,
                order_id: order.id,
                handler: function(response) {
                    // Verify payment
                    fetch('/api/verify-payment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            onSuccess(response);
                        } else {
                            onFailure('Payment verification failed');
                        }
                    });
                },
                prefill: {
                    name: '',
                    email: '',
                    contact: ''
                },
                theme: {
                    color: '#2563eb'
                },
                modal: {
                    ondismiss: function() {
                        onFailure('Payment cancelled');
                    }
                }
            };

            const razorpay = new Razorpay(options);
            razorpay.open();

        } catch (error) {
            console.error('Payment initialization failed:', error);
            onFailure('Failed to initialize payment');
        }
    },

    async createOrder(amount, planId) {
        // This would be your server endpoint
        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount, planId })
        });
        return response.json();
    }
};

// Load Razorpay script
function loadRazorpayScript() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}