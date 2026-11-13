import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";

import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { PortalScreen } from "../screens/PortalScreen";
import { DriverLoginScreen } from "../screens/DriverLoginScreen";
import { DriverPortalScreen } from "../screens/DriverPortalScreen";

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={PortalScreen} />
        <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
        <Stack.Screen name="DriverMain" component={DriverPortalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
