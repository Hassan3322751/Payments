import { loadStripe } from "@stripe/stripe-js"
import { pay } from '../../services/orderService'; //Check (pay route for stripe pay id) file in this folder use in backend as api endpint
import { toast } from 'react-toastify';

import './btnsStyle.css'

export default function CARDS_PAYMENT({ order }) {  //Getting ordered/ cart-items as props

    const CARD_PAY = async() => {

        const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISH_KEY)
        const body = {
            products: order,
        }
        const headers = {
            "Content-Type": "application/json"
        }
        const orderStatus = await pay(body, headers) //API Service To Call API Pay Endpoint For Session ID
        toast.error(orderStatus.rawType)
        
        const result = stripe.redirectToCheckout({ //Stripe Checkout Page will be rendered to Pay
            sessionId: orderStatus.id
        });
        
        if (result.error){
            toast.error(result.error)
            return
        }
    }
    return(
        <button onClick={() => CARD_PAY()}
            title="Pay by Debit or Credit Card"
            className="cardBtn"
        >
            Pay by 
            <img src="credit-card.png" alt="Credit Debit Card" title="Credit Debit Card" 
                style={imgStyle}
            />
        </button>
    )
}

const imgStyle = {
    width: '2rem',
    margin: '0px 7px'
}
