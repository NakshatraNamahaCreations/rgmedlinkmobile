    import { NavigationContainer } from "@react-navigation/native";
    import { createNativeStackNavigator } from "@react-navigation/native-stack";
    import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
    import { View, Text, Platform } from "react-native";
    import { Ionicons } from "@expo/vector-icons";
    import { useAuth } from "../context/AuthContext";
    import { C } from "../theme/colors";
    import { F } from "../theme/fonts";
    import { useSafeAreaInsets } from "react-native-safe-area-context";
    // Auth screens
    import LoginScreen from "../screens/auth/LoginScreen";
    import OTPScreen from "../screens/auth/OTPScreen";

    // Main screens
    import HomeScreen from "../screens/home/HomeScreen";
    import OrdersScreen from "../screens/orders/OrdersScreen";
    import OrderDetailScreen from "../screens/orders/OrderDetailScreen";
    import UploadPrescriptionScreen from "../screens/orders/UploadPrescriptionScreen";
    import OrderMethodScreen from "../screens/orders/OrderMethodScreen";
    import PrescriptionConfirmScreen from "../screens/orders/PrescriptionConfirmScreen";
    import CartScreen from "../screens/orders/CartScreen";
    import ReviewPrescriptionScreen from "../screens/orders/ReviewPrescriptionScreen";
    import DeliveryDetailsScreen from "../screens/orders/DeliveryDetailsScreen";
    import PaymentOptionsScreen from "../screens/orders/PaymentOptionsScreen";
    import OrderSuccessScreen from "../screens/orders/OrderSuccessScreen";
    import PaymentFailedScreen from "../screens/orders/PaymentFailedScreen";
    import TicketsScreen from "../screens/tickets/TicketsScreen";
    import CreateTicketScreen from "../screens/tickets/CreateTicketScreen";
    import TicketDetailScreen from "../screens/tickets/TicketDetailScreen";
    import ProfileScreen from "../screens/profile/ProfileScreen";
    import AddressDetailsScreen from "../screens/address/AddressDetailsScreen";
    import ChooseDeliveryAreaScreen from "../screens/address/ChooseDeliveryAreaScreen";
    import PatientDetailsScreen from "../screens/address/PatientDetailsScreen";
    import SavedAddressesScreen from "../screens/address/SavedAddressesScreen";
    import PrescriptionHistoryScreen from "../screens/prescriptions/PrescriptionHistoryScreen";
    import NotificationsScreen from "../screens/notifications/NotificationsScreen";
    import HealthArticleScreen from "../screens/health/HealthArticleScreen";
    import EditMedicineScreen from "../screens/orders/EditMedicineScreen";
    import PatientListScreen from "../screens/patient/PatientListScreen";
    import ChatScreen from "../screens/chat/ChatScreen";
 import RazorpayWebViewScreen from "../screens/orders/RazorpayWebViewScreen";
    
    const Stack       = createNativeStackNavigator();
    const RootStack   = createNativeStackNavigator();
    const Tab         = createBottomTabNavigator();
    const HomeStack   = createNativeStackNavigator();
    const OrdersStack = createNativeStackNavigator();
    const CartStack   = createNativeStackNavigator();
    const ProfileStack = createNativeStackNavigator();

    /* ── Tab config ── */
    const TAB_ICONS = {
      HomeTab:    { active: "home",              inactive: "home-outline"         },
      OrdersTab:  { active: "cube",              inactive: "cube-outline"         },
      CartTab:    { active: "cart",              inactive: "cart-outline"         },
      ProfileTab: { active: "person",            inactive: "person-outline"       },
    };

    const TAB_LABELS = {
      HomeTab:    "Home",
      OrdersTab:  "Orders",
      CartTab:    "Cart",
      ProfileTab: "Profile",
    };

    const HEADER_OPTS = {
      headerStyle: { backgroundColor: "#fff" },
      headerTitleStyle: { fontFamily: F.bold, fontSize: 17 },
      headerShadowVisible: false,
    };

    /* ── Home Stack ── */
    function HomeStackNav() {
      return (
        <HomeStack.Navigator screenOptions={HEADER_OPTS}>
          <HomeStack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
          <HomeStack.Screen name="HealthArticle" component={HealthArticleScreen} options={{ headerShown: false }} />
          <HomeStack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
          <HomeStack.Screen name="UploadPrescription" component={UploadPrescriptionScreen} options={{ title: "Upload Prescription" }} />
          <HomeStack.Screen name="PrescriptionConfirm" component={PrescriptionConfirmScreen} options={{ title: "Review Prescription" }} />
          <HomeStack.Screen name="ChooseDeliveryArea" component={ChooseDeliveryAreaScreen} options={{ headerShown: false }} />
          <HomeStack.Screen name="AddressDetails" component={AddressDetailsScreen} options={{ title: "Address Details" }} />
          <HomeStack.Screen name="PatientDetails" component={PatientDetailsScreen} options={{ title: "Patient Details" }} />
          <HomeStack.Screen name="ReviewPrescription" component={ReviewPrescriptionScreen} options={{ title: "" }} />
          <HomeStack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} options={{ title: "Delivery Details" }} />
          <HomeStack.Screen name="PaymentOptions" component={PaymentOptionsScreen} options={{ headerShown: false }} />
          <HomeStack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ headerShown: false }} />
          <HomeStack.Screen name="PaymentFailed" component={PaymentFailedScreen} options={{ headerShown: false }} />
          <HomeStack.Screen
  name="RazorpayWebView"
  component={RazorpayWebViewScreen}
  options={{ headerShown: false }}
/>
          <HomeStack.Screen
    name="EditMedicineScreen" 
    component={EditMedicineScreen} 
  />
        </HomeStack.Navigator>
      );
    }

    /* ── Orders Stack ── */
    function OrdersStackNav() {
      return (
        <OrdersStack.Navigator screenOptions={HEADER_OPTS}>
          <OrdersStack.Screen name="OrdersList"          component={OrdersScreen}            options={{ title: "My Orders" }} />
          <OrdersStack.Screen name="OrderDetail"         component={OrderDetailScreen}       options={{ title: "Order Details" }} />
          <OrdersStack.Screen name="UploadPrescription"  component={UploadPrescriptionScreen} options={{ title: "Upload Prescription" }} />
          <OrdersStack.Screen name="PrescriptionConfirm" component={PrescriptionConfirmScreen} options={{ title: "Confirm Prescription" }} />
          <OrdersStack.Screen name="OrderMethod"         component={OrderMethodScreen}       options={{ title: "" }} />
          <OrdersStack.Screen name="Cart"                component={CartScreen}              options={{ title: "" }} />
          <OrdersStack.Screen name="ReviewPrescription" component={ReviewPrescriptionScreen} options={{ title: "" }} />
          <OrdersStack.Screen name="DeliveryDetails"    component={DeliveryDetailsScreen}    options={{ title: "Delivery Details" }} />
          <OrdersStack.Screen name="PaymentOptions"    component={PaymentOptionsScreen}    options={{ headerShown: false }} />
          <OrdersStack.Screen name="OrderSuccess"      component={OrderSuccessScreen}      options={{ headerShown: false }} />
          <OrdersStack.Screen name="PaymentFailed"    component={PaymentFailedScreen}    options={{ headerShown: false }} />
          <OrdersStack.Screen name="ChooseDeliveryArea" component={ChooseDeliveryAreaScreen} options={{ title: "Choose delivery area" }} />
          <OrdersStack.Screen name="AddressDetails"     component={AddressDetailsScreen}    options={{ title: "Address Details" }} />
          <OrdersStack.Screen name="PatientDetails"    component={PatientDetailsScreen}    options={{ title: "Patient Details" }} />

          <OrdersStack.Screen
    name="EditMedicineScreen"
    component={EditMedicineScreen}
  />
  <OrdersStack.Screen
  name="RazorpayWebView"
  component={RazorpayWebViewScreen}
  options={{ headerShown: false }}
/>
        </OrdersStack.Navigator>
      );
    }

    /* ── Cart Stack ── */
    function CartStackNav() {
      return (
        <CartStack.Navigator screenOptions={HEADER_OPTS}>
          <CartStack.Screen name="CartHome"           component={CartScreen}              options={{ title: "" }} />
          <CartStack.Screen name="ReviewPrescription" component={ReviewPrescriptionScreen} options={{ title: "" }} />
          <CartStack.Screen name="DeliveryDetails"    component={DeliveryDetailsScreen}    options={{ title: "Delivery Details" }} />
          <CartStack.Screen name="PaymentOptions"    component={PaymentOptionsScreen}    options={{ headerShown: false }} />
          <CartStack.Screen name="OrderSuccess"      component={OrderSuccessScreen}      options={{ headerShown: false }} />
          <CartStack.Screen name="PaymentFailed"    component={PaymentFailedScreen}    options={{ headerShown: false }} />
          <CartStack.Screen name="ChooseDeliveryArea" component={ChooseDeliveryAreaScreen} options={{ title: "Choose delivery area" }} />
          <CartStack.Screen name="AddressDetails"     component={AddressDetailsScreen}    options={{ title: "Address Details" }} />
          <CartStack.Screen name="PatientDetails"     component={PatientDetailsScreen}    options={{ title: "Patient Details" }} />
          <CartStack.Screen 
    name="EditMedicineScreen" 
    component={EditMedicineScreen} 
  />
  <CartStack.Screen
  name="RazorpayWebView"
  component={RazorpayWebViewScreen}
  options={{ headerShown: false }}
/>
        </CartStack.Navigator>
      );
    }

    /* ── Profile Stack (includes Support/Tickets) ── */
    function ProfileStackNav() {
      return (
        <ProfileStack.Navigator screenOptions={HEADER_OPTS}>
          <ProfileStack.Screen name="ProfileHome"       component={ProfileScreen}            options={{ headerShown: false }} />
          <ProfileStack.Screen name="Tickets"            component={TicketsScreen}            options={{ title: "Tickets" }} />
          <ProfileStack.Screen name="CreateTicket"       component={CreateTicketScreen}       options={{ title: "New Ticket" }} />
          <ProfileStack.Screen
            name="TicketSuccess"
            component={require("../screens/tickets/TicketSuccessScreen").default}
            options={{ headerShown: false }}
          />
          <ProfileStack.Screen 
            name="ChatScreen" 
            component={ChatScreen} 
            options={{ title: "Support Chat" }}
          />
          <ProfileStack.Screen name="TicketDetail"       component={TicketDetailScreen}       options={{ title: "Ticket" }} />
          <ProfileStack.Screen name="SavedAddresses"         component={SavedAddressesScreen}       options={{ headerShown: false }} />
          <ProfileStack.Screen name="PrescriptionHistory"   component={PrescriptionHistoryScreen}  options={{ headerShown: false }} />
          <ProfileStack.Screen name="ChooseDeliveryArea" component={ChooseDeliveryAreaScreen} options={{ headerShown: false }} />
          <ProfileStack.Screen name="AddressDetails"     component={AddressDetailsScreen}     options={{ title: "Address Details" }} />
          <ProfileStack.Screen name="ReviewPrescription" component={ReviewPrescriptionScreen} options={{ title: "" }} />
          <ProfileStack.Screen name="DeliveryDetails"    component={DeliveryDetailsScreen}    options={{ title: "Delivery Details" }} />
          <ProfileStack.Screen name="PatientDetails"     component={PatientDetailsScreen}     options={{ title: "Patient Details" }} />
          <ProfileStack.Screen name="PaymentOptions"     component={PaymentOptionsScreen}     options={{ headerShown: false }} />
          <ProfileStack.Screen name="OrderSuccess"       component={OrderSuccessScreen}       options={{ headerShown: false }} />
          <ProfileStack.Screen name="PaymentFailed"      component={PaymentFailedScreen}      options={{ headerShown: false }} />
          <ProfileStack.Screen 
            name="EditMedicineScreen" 
            component={EditMedicineScreen} 
          />
          <ProfileStack.Screen 
            name="PatientList" 
            component={PatientListScreen} 
            options={{ title: "My Patients" }} 
          />
        </ProfileStack.Navigator>
      );
    }

    /* ── Bottom Tabs ── */
    function MainTabs() {
      const insets = useSafeAreaInsets();
      return (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color }) => {
              const cfg      = TAB_ICONS[route.name];
              const iconName = focused ? cfg.active : cfg.inactive;
              return (
                <View style={{ alignItems: "center" }}>
                  {focused && (
                    <View style={{
                      position: "absolute", top: -12,
                      width: 4, height: 4, borderRadius: 2,
                      backgroundColor: C.brand,
                    }} />
                  )}
                  <Ionicons name={iconName} size={22} color={color} />
                </View>
              );
            },
            tabBarLabel: ({ focused, color }) => (
              <Text style={{
                fontSize: 11,
                fontFamily: focused ? F.bold : F.medium,
                color, marginTop: -2,
              }}>
                {TAB_LABELS[route.name]}
              </Text>
            ),
            tabBarActiveTintColor:   C.brand,
            tabBarInactiveTintColor: "#94A3B8",
          tabBarStyle: {
    backgroundColor: "#fff",
    borderTopWidth: 0,

    height: 60 + insets.bottom,     // ✅ ONE height only
    paddingTop: 6,
    paddingBottom: insets.bottom,   // ✅ FIXED

    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
            headerShown: false,
          })}
        >
          <Tab.Screen name="HomeTab"    component={HomeStackNav}    listeners={({ navigation }) => ({ tabPress: () => navigation.navigate("HomeTab", { screen: "HomeScreen" }) })} />
          <Tab.Screen name="OrdersTab"  component={OrdersStackNav}  listeners={({ navigation }) => ({ tabPress: () => navigation.navigate("OrdersTab", { screen: "OrdersList" }) })} />
          <Tab.Screen name="CartTab"    component={CartStackNav}    listeners={({ navigation }) => ({ tabPress: () => navigation.navigate("CartTab", { screen: "CartHome" }) })} />
          <Tab.Screen name="ProfileTab" component={ProfileStackNav} listeners={({ navigation }) => ({ tabPress: () => navigation.navigate("ProfileTab", { screen: "ProfileHome" }) })} />
        </Tab.Navigator>
      );
    }

    /* ── Auth Stack (OTP flow — navigated to programmatically) ── */
    function AuthStack() {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OTP"   component={OTPScreen}   />
          <Stack.Screen name="PatientList"component={PatientListScreen}
    options={{ title: "My Patients" }}
  />

        </Stack.Navigator>
      );
    }

    /* ── Root Navigator ── */
    export default function AppNavigator() {
      const { user, loading } = useAuth();

      if (loading) {
        return (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#2D0810" }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: C.brand,
              justifyContent: "center", alignItems: "center",
            }}>
              <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff" }}>RG</Text>
            </View>
          </View>
        );
      }

      return (
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="Main" component={MainTabs} />
          </RootStack.Navigator>
        </NavigationContainer>
      );
    }
