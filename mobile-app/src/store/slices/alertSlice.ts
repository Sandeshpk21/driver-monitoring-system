import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Alert {
  id: string;
  type: 'drowsy' | 'distracted' | 'phone' | 'warning';
  message: string;
  timestamp: Date;
}

interface AlertState {
  alerts: Alert[];
  currentAlert: Alert | null;
}

const initialState: AlertState = {
  alerts: [],
  currentAlert: null,
};

const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlert: (state, action: PayloadAction<Omit<Alert, 'id' | 'timestamp'>>) => {
      const newAlert: Alert = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      state.alerts.push(newAlert);
      state.currentAlert = newAlert;
    },
    dismissAlert: (state) => {
      state.currentAlert = null;
    },
    clearAlerts: (state) => {
      state.alerts = [];
      state.currentAlert = null;
    },
  },
});

export const { addAlert, dismissAlert, clearAlerts } = alertSlice.actions;
export default alertSlice.reducer;