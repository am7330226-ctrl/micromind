import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useStoreState } from '../store/StoreContext';
import { Ionicons } from '@expo/vector-icons';

// Screens
import FeedScreen from '../screens/FeedScreen';
import DeckScreen from '../screens/DeckScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Components used in Inbox tab
import BrainDumpInput from '../components/BrainDumpInput';
import TaskCard from '../components/TaskCard';
import TaskDetailSheet from '../components/TaskDetailSheet';
import Header from '../components/Header';

const Tab = createBottomTabNavigator();

// ── Inbox Tab (Brain Dump + Task List) ──────────────────────────────────────
function InboxScreen({ onOpenDetail }) {
  const { tasks, theme } = useStoreState();
  const colors = theme.colors;

  return (
    <View style={styles.tabScreen}>
      <BrainDumpInput />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {tasks.length === 0 ? (
          <View style={styles.emptyInbox}>
            <Ionicons name="flash-outline" size={36} color={colors.textSecondary} />
            <View style={{ height: 8 }} />
          </View>
        ) : (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} onOpenDetail={onOpenDetail} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── Tab Navigator ────────────────────────────────────────────────────────────
export default function TabNavigator() {
  const { theme, thoughts } = useStoreState();
  const colors = theme.colors;

  const [selectedTask, setSelectedTask] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const handleOpenDetail = task => {
    setSelectedTask(task);
    setDetailVisible(true);
  };

  // Unreviewed thought count for badge
  const deckBadgeCount = (thoughts || []).filter(t => t.status === 'active').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
      <Header />

      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bgSidebar,
            borderTopColor: colors.borderColor,
            borderTopWidth: 1,
            height: 62,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: colors.primaryViolet,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, focused, size }) => {
            const iconMap = {
              Feed:     focused ? 'sparkles'        : 'sparkles-outline',
              Deck:     focused ? 'albums'           : 'albums-outline',
              Inbox:    focused ? 'flash'            : 'flash-outline',
              Settings: focused ? 'settings'         : 'settings-outline',
            };
            return <Ionicons name={iconMap[route.name] || 'ellipse'} size={22} color={color} />;
          },
        })}
      >
        {/* Feed — Micro-Insights */}
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{ tabBarLabel: 'Feed' }}
        />

        {/* Deck — Memory Deck */}
        <Tab.Screen
          name="Deck"
          component={DeckScreen}
          options={{
            tabBarLabel: 'Deck',
            tabBarBadge: deckBadgeCount > 0 ? deckBadgeCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: colors.accentEmerald || '#10B981',
              fontSize: 9,
              minWidth: 16,
              height: 16,
              lineHeight: 16,
            },
          }}
        />

        {/* Inbox — Brain Dump + Tasks */}
        <Tab.Screen
          name="Inbox"
          options={{ tabBarLabel: 'Inbox' }}
        >
          {() => <InboxScreen onOpenDetail={handleOpenDetail} />}
        </Tab.Screen>

        {/* Settings */}
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarLabel: 'Settings' }}
        />
      </Tab.Navigator>

      <TaskDetailSheet
        task={selectedTask}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabScreen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  emptyInbox: {
    alignItems: 'center',
    paddingTop: 48,
    opacity: 0.4,
  },
});
