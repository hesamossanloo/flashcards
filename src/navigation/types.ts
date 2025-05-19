import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  DeckDetail: { deckId: string };
  CardDetail: { deckId: string; cardId: string };
  CreateDeck: undefined;
  EditDeck: { deckId: string };
  Study: { deckId: string };
};

export type TabParamList = {
  Home: undefined;
  MyDecks: undefined;
  Search: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = 
  BottomTabScreenProps<TabParamList, T>; 