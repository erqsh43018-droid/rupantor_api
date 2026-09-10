export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            success:false,
            message:"Method not allowed"
        });

    }


    try {

        const {
            transactionId,
            expectedAmount
        } = req.body || {};


        if (!transactionId) {

            return res.status(400).json({

                success:false,

                message:
                    "Transaction ID is required."

            });

        }


        const amount =
            Number(expectedAmount);


        if (!Number.isFinite(amount)) {

            return res.status(400).json({

                success:false,

                message:
                    "Invalid amount."

            });

        }


        /*
         * Ask RupantorPay to verify
         * the real transaction.
         */

        const response =
            await fetch(
                "https://payment.rupantorpay.com/api/payment/verify-payment",
                {

                    method:"POST",

                    headers:{

                        "Content-Type":
                            "application/json",

                        "X-API-KEY":
                            process.env.RUPANTOR_API_KEY

                    },

                    body:
                        JSON.stringify({

                            transaction_id:
                                transactionId

                        })

                }
            );


        const data =
            await response.json();


        console.log(
            "Verification response:",
            data
        );


        if (!response.ok) {

            return res.status(400).json({

                success:false,

                message:
                    data.message ||
                    "Payment verification failed."

            });

        }


        /*
         * Real verification.
         *
         * BOTH conditions must pass:
         *
         * 1. status = COMPLETED
         * 2. paid amount = expected amount
         */

        const status =
            String(
                data.status || ""
            ).toUpperCase();


        const paidAmount =
            Number(data.amount);


        const isValid =
            status === "COMPLETED" &&
            paidAmount === amount;


        if (!isValid) {

            return res.status(400).json({

                success:false,

                message:
                    "Payment verification failed.",

                status:status,

                amount:
                    data.amount

            });

        }


        /*
         * Payment is genuinely verified.
         */

        return res.status(200).json({

            success:true,

            message:
                "Payment verified successfully.",

            transaction_id:
                data.transaction_id ||
                transactionId,

            trx_id:
                data.trx_id || null,

            amount:
                data.amount,

            currency:
                data.currency || "BDT",

            payment_method:
                data.payment_method || null,

            status:
                status

        });


    } catch(error) {

        console.error(error);


        return res.status(500).json({

            success:false,

            message:
                "Verification server error."

        });

    }

}