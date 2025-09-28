import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type PropsWithChildren = React.PropsWithChildren<{ title: string; description?: string }>;

export function Surface({ title, description, children }: PropsWithChildren) {
  return (
    <View style={styles.surface}>
      <Text style={styles.heading}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.divider} />
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

export function Pill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 32,
    elevation: 6,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  description: {
    marginTop: 8,
    fontSize: 15,
    color: 'rgba(15,23,42,0.65)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(15,23,42,0.08)',
    marginVertical: 18,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37,99,235,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillLabel: {
    fontWeight: '600',
    color: '#2563eb',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
});

