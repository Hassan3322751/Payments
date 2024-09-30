import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import classes from './paymentPage.module.css';

import { useCart } from '../../hooks/useCart';

import Title from '../../components/Title/Title';
import OrderItemsList from '../../components/OrderItemsList/OrderItemsList';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';

// THIS PAGE IS UNDER DEVELOPMENT SOME BUGS TO BE FIXED AND WAITING FOR JAZZCASH CREDENTIALS ARRIVAL

export default function PaymentPage() {
  const { cart } = useCart(); //Getting Cart Items For Payment
  const [order, setOrder] = useState({ ...cart});  

  const [formData, setFormData] = useState({
    jazz_cash_no: '', //Jazz Sandbox Phone Number
    cnic_digits: '',//Jazz Sandbox CNIC Digits
    product_id: '',
    price: ''
  })

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();

  useEffect(() => {
    getNewOrderForCurrentUser().then(data => setOrder(data));
  }, []);

  if (!order) return;

  const submit = info => {
    setFormData({
      jazz_cash_no: info.phoneNo,
      cnic_digits: info.cnicDigits,
      product_id: order._id,
      price: order.items[0].price * 100 //It is a step required more details in jazz cash sandbox documentation
    })

    createCharge(formData);
  }

  return (
    <>
      <div className={classes.container}>
        <div className={classes.content}>
          <Title title="Order Form" fontSize="1.6rem" />
          <div className={classes.summary}>
            <div>
              <h3>Name:</h3>
              <span>{order.name}</span>
            </div>
            <div>
              <h3>Address:</h3>
              <span>{order.address}</span>
            </div>
          </div>
          <OrderItemsList order={order} />
        </div>

        <div className={classes.map}>

          <form onSubmit={handleSubmit(submit)} className={classes.container}>
            <div className={classes.content}>
              <Title title="Order Form" fontSize="1.6rem" />
              <div className={classes.inputs}>
                <Input
                  defaultValue={'03123456789'}
                  label="Phone No."
                  {...register('phoneNo')}
                  error={errors.name}
                />
                <Input
                  defaultValue={'345678'}
                  label="CNIC Digits"
                  {...register('cnicDigits')}
                  error={errors.address}
                />
              </div>
            </div>

            <div className={classes.buttons_container}>
              <div className={classes.buttons}>
                <Button
                  type="submit"
                  text="Proceed To Payment"
                  width="100%"
                  height="3rem"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

const createCharge = (formData) => {
  const DateTime = new Date();
  const pp_TxnDateTime = DateTime.toISOString().replace(/[-:]/g, '').replace(/[TZ.]/g, '').slice(0, 14);

  const ExpiryDateTime = new Date(DateTime);
  ExpiryDateTime.setHours(ExpiryDateTime.getHours() + 1);
  const pp_TxnExpiryDateTime = ExpiryDateTime.toISOString().replace(/[-:]/g, '').replace(/[TZ.]/g, '').slice(0, 14);

  const pp_TxnRefNo = 'T' + pp_TxnDateTime;

  const txnInfo = {
    "pp_Language": process.env.REACT_APP_JC_LANGUAGE,
    "pp_MerchantID": process.env.REACT_APP_JC_MERCHANT_ID,
    "pp_SubMerchantID": "",
    "pp_Password": process.env.REACT_APP_JC_PASSWORD,
    'pp_TxnRefNo': pp_TxnRefNo,
    'pp_MobileNumber': formData.jazz_cash_no,
    'pp_CNIC': formData.cnic_digits,
    'pp_Amount': formData.price,
    'pp_DiscountedAmount':"",
    'pp_TxnCurrency': process.env.REACT_APP_JC_CURRENCY_CODE,
    'pp_TxnDateTime': pp_TxnDateTime,
    'pp_BillReference': "billRef",
    'pp_Description': "Test Payment",
    'pp_TxnExpiryDateTime': pp_TxnExpiryDateTime,
    'pp_SecureHash': "",
    'ppmpf_1' : "",
    'ppmpf_2' : "",
    'ppmpf_3' : "",
    'ppmpf_4' : "",
    'ppmpf_5' : ""
  }

  const hash = createHash(txnInfo)
  console.log(hash)
}

const createHash = (txnInfo) => {

  const sortAndFilterObject = (obj) => {
    const filteredEntries = Object.entries(obj)
        .filter(([key, value]) => value !== null && value !== undefined && value !== "");

    filteredEntries.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    const sortedObject = Object.fromEntries(filteredEntries);

    return sortedObject;
};

const sortedTxnInfo = sortAndFilterObject(txnInfo);

let str = "";
for (const key in sortedTxnInfo) {
    if (sortedTxnInfo.hasOwnProperty(key)) {
        const value = sortedTxnInfo[key];
        if (value !== null && value !== undefined && value !== "") {
            str += '&' + value;
        }
    }
}

const finalStr = process.env.REACT_APP_JC_INTEGERITY_SALT + str;
return finalStr
}
