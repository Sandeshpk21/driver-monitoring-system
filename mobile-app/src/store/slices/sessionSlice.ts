import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SessionState {
  isMonitoring: boolean;
  sessionId: string | null;
  startTime: Date | null;
  detections: {
    drowsy: number;
    distracted: number;
    phoneUse: number;
  };
}

const initialState: SessionState = {
  isMonitoring: false,
  sessionId: null,
  startTime: null,
  detections: {
    drowsy: 0,
    distracted: 0,
    phoneUse: 0,
  },
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    startSession: (state, action: PayloadAction<string>) => {
      state.isMonitoring = true;
      state.sessionId = action.payload;
      state.startTime = new Date();
      state.detections = { drowsy: 0, distracted: 0, phoneUse: 0 };
    },
    stopSession: (state) => {
      state.isMonitoring = false;
      state.sessionId = null;
      state.startTime = null;
    },
    incrementDetection: (state, action: PayloadAction<'drowsy' | 'distracted' | 'phoneUse'>) => {
      state.detections[action.payload]++;
    },
  },
});

export const { startSession, stopSession, incrementDetection } = sessionSlice.actions;
export default sessionSlice.reducer;