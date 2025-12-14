import { createContext, useContext, useReducer, useEffect } from 'react';
import { DEFAULT_FORMAT } from '../constants/label-formats';

const AppContext = createContext(null);

const initialState = {
  // Step 1: CSV Import
  csvData: {
    headers: [],
    rows: [],
    fileName: '',
    rowCount: 0
  },

  // Step 2: Column Mapping
  columnMapping: {
    name: null,
    company: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    zip: null
  },
  autoDetectionConfidence: {},

  // Step 3: Label Format
  selectedFormat: DEFAULT_FORMAT,

  // Wizard navigation
  currentStep: 1,
  completedSteps: []
};

const actionTypes = {
  SET_CSV_DATA: 'SET_CSV_DATA',
  SET_COLUMN_MAPPING: 'SET_COLUMN_MAPPING',
  SET_AUTO_DETECTION: 'SET_AUTO_DETECTION',
  SET_SELECTED_FORMAT: 'SET_SELECTED_FORMAT',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  MARK_STEP_COMPLETE: 'MARK_STEP_COMPLETE',
  RESET_STATE: 'RESET_STATE',
  LOAD_STATE: 'LOAD_STATE'
};

function appReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_CSV_DATA:
      return {
        ...state,
        csvData: action.payload
      };

    case actionTypes.SET_COLUMN_MAPPING:
      return {
        ...state,
        columnMapping: {
          ...state.columnMapping,
          ...action.payload
        }
      };

    case actionTypes.SET_AUTO_DETECTION:
      return {
        ...state,
        columnMapping: {
          ...state.columnMapping,
          ...action.payload.mapping
        },
        autoDetectionConfidence: action.payload.confidence
      };

    case actionTypes.SET_SELECTED_FORMAT:
      return {
        ...state,
        selectedFormat: action.payload
      };

    case actionTypes.SET_CURRENT_STEP:
      return {
        ...state,
        currentStep: action.payload
      };

    case actionTypes.MARK_STEP_COMPLETE:
      if (state.completedSteps.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        completedSteps: [...state.completedSteps, action.payload]
      };

    case actionTypes.RESET_STATE:
      return {
        ...initialState,
        selectedFormat: DEFAULT_FORMAT
      };

    case actionTypes.LOAD_STATE:
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('labelmerge-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: actionTypes.LOAD_STATE, payload: parsed });
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    try {
      // Don't save the initial empty state
      if (state.csvData.rowCount > 0 || state.currentStep > 1) {
        localStorage.setItem('labelmerge-state', JSON.stringify(state));
      }
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [state]);

  const value = {
    state,
    dispatch,
    actions: actionTypes
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Helper hooks for common actions
export function useWizardNavigation() {
  const { state, dispatch, actions } = useAppContext();

  const goToStep = (step) => {
    dispatch({ type: actions.SET_CURRENT_STEP, payload: step });
  };

  const nextStep = () => {
    dispatch({ type: actions.MARK_STEP_COMPLETE, payload: state.currentStep });
    dispatch({ type: actions.SET_CURRENT_STEP, payload: state.currentStep + 1 });
  };

  const prevStep = () => {
    dispatch({ type: actions.SET_CURRENT_STEP, payload: state.currentStep - 1 });
  };

  const resetWizard = () => {
    dispatch({ type: actions.RESET_STATE });
    localStorage.removeItem('labelmerge-state');
  };

  const canGoNext = () => {
    switch (state.currentStep) {
      case 1: // CSV Import
        return state.csvData.rowCount > 0;
      case 2: // Column Mapping
        return state.columnMapping.name &&
               state.columnMapping.addressLine1 &&
               state.columnMapping.city &&
               state.columnMapping.state &&
               state.columnMapping.zip;
      case 3: // Label Format
        return state.selectedFormat !== null;
      default:
        return true;
    }
  };

  return {
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    goToStep,
    nextStep,
    prevStep,
    resetWizard,
    canGoNext
  };
}
