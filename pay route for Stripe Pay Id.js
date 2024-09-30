import { Router } from 'express';
import handler from 'express-async-handler';
import auth from '../middleware/auth.mid.js';

import { BAD_REQUEST } from '../constants/httpStatus.js';
import { OrderModel } from '../models/order.model.js';
import { OrderStatus } from '../constants/orderStatus.js';
import { UserModel } from '../models/user.model.js';
import { sendEmailReceipt } from '../helpers/mail.helper.js';

import stripe from 'stripe';
const stripeInstance = new stripe('sk_test_51Q41a4KIet24XI.......zIsn9bc0Aeo2OuVnin3PDBAC9w9Tn00nu9aOcDJ'); //Strip test Key

const router = Router();
router.use(auth);


router.post(
  '/pay',
  handler(async (req, res) => {
    const { body } = req.body;
    const order = await getNewOrderForCurrentUser(req);

    if (!order) {
      res.status(BAD_REQUEST).send('Order Not Found!');
      return;
    }

    const line_items = body.map((product) => ({
        price_data:{
        currency: "usd",
        product_data: {
          name: product.food.name,
          images: [product.food.imageUrl]
        },
        unit_amount: Math.round(product.food.price * 100),
      },
      quantity: product.quantity
    })
  );

  try {
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: line_items,
      mode: "payment",
      success_url: "http://localhost:3000/PaymentSuccess", 
      cancel_url:"http://localhost:3000/PaymentFailed"
    })

    order.paymentId = session.id;
    order.status = OrderStatus.PAYED;
    await order.save();
    sendEmailReceipt(order);

    res.json({id: session.id})  // Main thing is session id returned to use in for rendering stripe checkout page

  } catch (error) {
    console.log("Error: " + error)
    res.send(error)
  }

  })
);

const getNewOrderForCurrentUser = async req =>
  await OrderModel.findOne({
    user: req.user.id,
    status: OrderStatus.NEW,
  }).populate('user');
export default router;
