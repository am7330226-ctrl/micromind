import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useStoreState } from '../store/StoreContext';
import { Ionicons } from '@expo/vector-icons';
import BrainDumpInput from '../components/BrainDumpInput';
import EisenhowerMatrix from '../components/EisenhowerMatrix';
import FocusThree from '../components/FocusThree';
import HabitTracker from '../components/HabitTracker';
import PomodoroTimer from '../components/PomodoroTimer';
import AnalyticsScreen from '../components/AnalyticsScreen';
import TaskCard from '../components/TaskCard';
import TaskDetailSheet from '../components/TaskDetailSheet';
import Header from '../components/Header';

const Tab = createBottomTabNavigator();

function InboxScreen({ onOpenDetail }) {
  const { tasks } = useStoreState();

  return (
    <View style={styles.tabScreen}>
      <BrainDumpInput />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onOpenDetail={onOpenDetail} />
        ))}
      </ScrollView>
    </View>
  );
}

function MatrixScreen({ onOpenDetail }) {
  return (
    <View style={styles.tabScreen}>
      <EisenhowerMatrix onOpenDetail={onOpenDetail} />
    </View>
  );
}

function FocusScreen({ onOpenDetail }) {
  return (
    <View style={styles.tabScreen}>
      <FocusThree onOpenDetail={onOpenDetail} />
    </View>
  );
}

function HabitsScreen() {
  return (
    <View style={styles.tabScreen}>
      <HabitTracker />
    </View>
  );
}

function AnalyticsTabScreen() {
  return (
    <View style={styles.tabScreen}>
      <AnalyticsScreen />
    </View>
  );
}

function PomodoroTabScreen() {
  return (
    <View style={styles.tabScreen}>
      <PomodoroTimer />
    </View>
  );
}

export default function TabNavigator() {
  const { theme } = useStoreState();
  const colors = theme.colors;

  const [selectedTask, setSelectedTask] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const handleOpenDetail = task => {
    setSelectedTask(task);
    setDetailVisible(true);
  };

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
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: colors.primaryViolet,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarIcon: ({ color, size }) => {
            let iconName = 'sparkles';
            if (route.name === 'Inbox') iconName = 'flash';
            else if (route.name === 'Matrix') iconName = 'grid';
            else if (route.name === 'Focus') iconName = 'disc-outline';
            else if (route.name === 'Timer') iconName = 'timer';
            else if (route.name === 'Habits') iconName = 'leaf';
            else if (route.name === 'Stats') iconName = 'stats-chart';

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Inbox">
          {() => <InboxScreen onOpenDetail={handleOpenDetail} />}
        </Tab.Screen>

        <Tab.Screen name="Matrix">
          {() => <MatrixScreen onOpenDetail={handleOpenDetail} />}
        </Tab.Screen>

        <Tab.Screen name="Focus">
          {() => <FocusScreen onOpenDetail={handleOpenDetail} />}
        </Tab.Screen>

        <Tab.Screen name="Timer" component={PomodoroTabScreen} />
        <Tab.Screen name="Habits" component={HabitsScreen} />
        <Tab.Screen name="Stats" component={AnalyticsTabScreen} />
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
    paddingTop: 12,
  },
});
