import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, ActivityIndicator, Platform } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { colors } from './theme';
import { injectInputTextColorFix } from './lib/webFormFix';
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import FeedScreen from './screens/FeedScreen';
import ComposeScreen from './screens/ComposeScreen';
import EventsScreen from './screens/EventsScreen';
import RootsScreen from './screens/RootsScreen';
import JobsScreen from './screens/JobsScreen';
import ProfileScreen from './screens/ProfileScreen';
import MoreScreen from './screens/MoreScreen';
import EatsScreen from './screens/EatsScreen';
import StudyScreen from './screens/StudyScreen';
import CultureScreen from './screens/CultureScreen';
import PropertyScreen from './screens/PropertyScreen';
import PropertyComposeScreen from './screens/PropertyComposeScreen';
import StayPropertyScreen from './screens/StayPropertyScreen';
import ResourcesScreen from './screens/ResourcesScreen';
import PostCommentsScreen from './screens/PostCommentsScreen';
import CreatorHubScreen from './screens/CreatorHubScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.seaDeep,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ focused }) => {
          const icons: Record<string, string> = {
            Lime: '🌴', Linkup: '🎉', Roots: '🌳', Wuk: '💼', Creators: '✨', More: '🧭', You: '👤',
          };
          return <Text style={{ fontSize: focused ? 22 : 18 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="Lime" component={FeedScreen} />
      <Tab.Screen name="Linkup" component={EventsScreen} />
      <Tab.Screen name="Roots" component={RootsScreen} />
      <Tab.Screen name="Wuk" component={JobsScreen} />
      <Tab.Screen name="Creators" component={CreatorHubScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
      <Tab.Screen name="You" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') injectInputTextColorFix();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setHasProfile(null); return; }
    // Guests browse without a profile, so they skip onboarding.
    if (session.user.is_anonymous) { setHasProfile(true); return; }
    supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => setHasProfile(!!data));
  }, [session]);

  if (loading || (session && hasProfile === null)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.seaDeep }}>
        <ActivityIndicator color={colors.mango} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !hasProfile ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onDone={() => setHasProfile(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" component={Tabs} />
            <Stack.Screen name="Compose" component={ComposeScreen}
              options={{ presentation: 'modal', headerShown: true, title: 'Share wid de yard' }} />
            <Stack.Screen name="Eats" component={EatsScreen}
              options={{ headerShown: true, title: 'Eats 🍽️' }} />
            <Stack.Screen name="Study" component={StudyScreen}
              options={{ headerShown: true, title: 'Study 🎓' }} />
            <Stack.Screen name="Culture" component={CultureScreen}
              options={{ headerShown: true, title: 'Culture 🎭' }} />
            <Stack.Screen name="Property" component={PropertyScreen}
              options={{ headerShown: true, title: 'Property 🏡' }} />
            <Stack.Screen name="PropertyCompose" component={PropertyComposeScreen}
              options={{ headerShown: true, title: 'Post a listing' }} />
            <Stack.Screen name="StayProperty" component={StayPropertyScreen}
              options={{ headerShown: true, title: 'Stay & Property 🏡' }} />
            <Stack.Screen name="Resources" component={ResourcesScreen}
              options={{ headerShown: true, title: 'Resources 📋' }} />
            <Stack.Screen name="PostComments" component={PostCommentsScreen}
              options={{ headerShown: true, title: 'Comments 💬' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
