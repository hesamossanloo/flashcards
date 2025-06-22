import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import AddCardScreen from "../screens/AddCardScreen";
import BackupScreen from "../screens/BackupScreen";
import CreateDeckScreen from "../screens/CreateDeckScreen";
import DeckDetailScreen from "../screens/DeckDetailScreen";
import DecksScreen from "../screens/DecksScreen";
import EditCardScreen from "../screens/EditCardScreen";
import SettingsScreen from "../screens/SettingsScreen";
import StatsScreen, { SessionStatsScreen } from "../screens/StatsScreen";
import StudyScreen from "../screens/StudyScreen";
import StudySessionScreen from "../screens/StudySessionScreen";
import { MainTabParamList, RootStackParamList } from "../types";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        unmountOnBlur: true,
      }}
    >
      <Tab.Screen
        name="Decks"
        component={DecksScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cards" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Study"
        component={StudyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="book-open-variant"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="chart-bar"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerBackTitleVisible: true,
          headerBackTitle: "Back",
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateDeck"
          component={CreateDeckScreen}
          options={{
            title: "Create New Deck",
            headerBackTitle: "Home",
          }}
        />
        <Stack.Screen
          name="DeckDetail"
          component={DeckDetailScreen}
          options={{
            title: "Deck Details",
            headerBackTitle: "Decks",
          }}
        />
        <Stack.Screen
          name="StudySession"
          component={StudySessionScreen}
          options={{
            headerShown: true,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="AddCard"
          component={AddCardScreen}
          options={{
            title: "Add Card",
            headerBackTitle: "Deck Details",
          }}
        />
        <Stack.Screen
          name="EditCard"
          component={EditCardScreen}
          options={{
            title: "Edit Card",
            headerBackTitle: "Deck Details",
          }}
        />
        <Stack.Screen
          name="Stats"
          component={SessionStatsScreen}
          options={{
            title: "Session Results",
            headerBackTitle: "Study",
          }}
        />
        <Stack.Screen
          name="Backup"
          component={BackupScreen}
          options={{
            title: "Backup & Restore",
            headerBackTitle: "Settings",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
