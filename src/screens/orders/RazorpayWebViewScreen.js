import React, { useRef } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { verifyPayment } from "../../api/services";

export default function RazorpayWebViewScreen({ route, navigation }) {
  const { razorpayOrder, orderData, total, methodName } = route.params;
  const webviewRef = useRef();

 const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      function startPayment() {
        var options = {
          key: "rzp_test_SeA7aRbhFLtUBr",
          amount: "${razorpayOrder.amount}",
          currency: "INR",
          name: "RG MedLink",
          description: "Medicine Order",
          order_id: "${razorpayOrder.id}",
          handler: function (response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              success: true,
              ...response
            }));
          },
          modal: {
            ondismiss: function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                success: false
              }));
            }
          }
        };

        var rzp = new Razorpay(options);
        rzp.open();
      }

      window.onload = startPayment;
    </script>
  </body>
</html>
`;

  const handleMessage = async (event) => {
    const data = JSON.parse(event.nativeEvent.data);

    if (!data.success) {
      Alert.alert("Payment Cancelled");
      navigation.goBack();
      return;
    }

    try {
      await verifyPayment({
        orderId: orderData._id,
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
      });

      navigation.replace("OrderSuccess", {
        total,
        method: methodName,
        orderId: orderData.orderId,
        orderDbId: orderData._id,
      });

    } catch (err) {
      Alert.alert("Verification Failed");
      navigation.goBack();
    }
  };

  return (
    <View style={{ flex: 1 }}>
   <WebView
  ref={webviewRef}
  originWhitelist={["*"]}
  source={{ html }}
  onMessage={handleMessage}
  javaScriptEnabled={true}   // ✅ ADD THIS
  domStorageEnabled={true}   // ✅ ADD THIS
  startInLoadingState
  renderLoading={() => <ActivityIndicator style={{ flex: 1 }} />}
/>
    </View>
  );
}