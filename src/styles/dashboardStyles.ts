import { StyleSheet } from 'react-native';

export const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    minHeight: 48,
  },
  appointmentCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  appointmentButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    minHeight: 40,
  },
});