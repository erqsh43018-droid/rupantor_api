export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            message: "Method not allowed"
        });

    }


    try {

        const {
            product,
            amount
        } = req.body || {};


        /*
         * Allowed products
         * are fixed on the server.
         */

        const products = {

            "Product 1": 2,
            "Product 2": 3,
            "Product 3": 4,
            "Product 4": 5,
            "Product 5": 7

        };


        if (!products[product]) {

            return res.status(400).json({
                message: "Invalid product"
            });

        }


        /*
         * Do NOT trust amount
         * sent by frontend.
         */

        const realAmount =
            products[product];


        /*
         * Build your website URL.
         */

        const host =
            req.headers["x-forwarded-host"] ||
            req.headers.host;

        const protocol =
            req.headers["x-forwarded-proto"] ||
            "https";

        const siteUrl =
            `${protocol}://${host}`;


        /*
         * RupantorPay requires
         * fullname and email.
         *
         * No customer information
         * box is shown on your website.
         */

        const paymentData = {

            fullname: "Customer",

            email: "customer@example.com",

            amount:
                String(realAmount),

            success_url:
                `${siteUrl}/?payment=success&product=${encodeURIComponent(product)}`,

            cancel_url:
                `${siteUrl}/?payment=cancel`,

            metadata: {

                product: product,

                amount: String(realAmount)

            }

        };


        const response =
            await fetch(
                "https://payment.rupantorpay.com/api/payment/checkout",
                {

                    method:"POST",

                    headers:{

                        "Content-Type":
                            "application/json",

                        "X-API-KEY":
                            process.env.RUPANTOR_API_KEY,

                        "X-CLIENT":
                            host

                    },

                    body:
                        JSON.stringify(paymentData)

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.payment_url
        ){

            console.error(
                "RupantorPay error:",
                data
            );

            return res.status(400).json({

                message:
                    data.message ||
                    "Payment creation failed."

            });

        }


        return res.status(200).json({

            payment_url:
                data.payment_url

        });


    } catch(error) {

        console.error(error);


        return res.status(500).json({

            message:
                "Payment server error."

        });

    }

}
