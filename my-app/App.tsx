import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainScreen from './screens/MainScreen';
import RecipeScreen from './screens/RecipeScreen';

const Stack = createStackNavigator();

export default function App() {

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="main">
        <Stack.Screen
          name="main"
          component={MainScreen}
          options={{ headerShown: false }} />
        <Stack.Screen
          name="recipe"
          component={RecipeScreen}
          options={{ headerShown: false }} />


      </Stack.Navigator>
    </NavigationContainer>
  );
};

