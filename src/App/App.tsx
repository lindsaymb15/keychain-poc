import React, {
  Dispatch,
  Reducer,
  createContext,
  useContext,
  useReducer,
  useState,
  useRef,
} from 'react';
import {
  DeviceEventEmitter,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
  AppState,
} from 'react-native';
import {useEffect} from 'react';
import styles from './styles';
import {Provider} from 'react-native-paper';
import {Home} from '../components/pages';
import Beacons from 'react-native-beacons-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Characteristic, Device} from 'react-native-ble-plx';
import BackgroundActions from 'react-native-background-actions';
//import BackgroundService from 'react-native-background-actions';

interface DeviceData {
  device?: Device;
  alertDistance: string;
  name: string;
  rwCharacteristic: Characteristic;
}

interface AppLocalState {
  device: DeviceData | null;
}

type AppAction = {type: 'SET_DEVICE'; payload: DeviceData};

interface AppContextType {
  state: AppLocalState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppLocalState = {
  device: null,
};

const appReducer: Reducer<AppLocalState, AppAction> = (state, action) => {
  switch (action.type) {
    case 'SET_DEVICE':
      return {...state, device: action.payload};
    default:
      return state;
  }
};

const requestBluetoothPermission = async () => {
  if (Platform.OS === 'ios') {
    return true;
  }
  if (
    Platform.OS === 'android' &&
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  ) {
    const apiLevel = parseInt(Platform.Version.toString(), 10);

    if (apiLevel < 31) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    if (
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN &&
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
    ) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return (
        result['android.permission.BLUETOOTH_CONNECT'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.BLUETOOTH_SCAN'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.ACCESS_FINE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }
  }

  // this.showErrorToast('Permission have not been granted')
  console.warn('Permission have not been granted');

  return false;
};

export interface Beacon {
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  proximity: string;
  accuracy: number;
}

function App(): React.JSX.Element {
  const appState = useRef(AppState.currentState);
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const region = {
    identifier: 'ESP TAG APP',
    uuid: 'fda50693-a4e2-4fb1-afcf-c6eb07647825', // Why this is burned ?
    major: 10167,
    minor: 61958,
  };

  //read the AppState
  // useEffect(() => {
  //   const subscription = AppState.addEventListener('change', nextAppState => {
  //     if (
  //       appState.current.match(/inactive|background/) &&
  //       nextAppState === 'active'
  //     ) {
  //       console.log('App has come to the foreground!');
  //     }

  //     appState.current = nextAppState;
  //     setAppStateVisible(appState.current);
  //     console.log('AppState', appState.current);
  //   });

  //   return () => {
  //     subscription.remove();
  //   };
  // }, []);

  // useEffect(() => {
  //   //Original
  //   requestBluetoothPermission();
  //   rangeBeacons();
  // }, []);

  useEffect(() => {
    requestBluetoothPermission();
    const startBackgroundTask = async () => {
      if (Platform.OS === 'android') {
        Beacons.detectIBeacons();
      } else {
        Beacons.requestAlwaysAuthorization();
        Beacons.startMonitoringForRegion(region);
      }

      try {
        await Beacons.startRangingBeaconsInRegion(region);
        console.log('Beacons ranging started successfully in the foreground!');
      } catch (err) {
        console.error(
          `Beacons ranging not started in the foreground, error: ${err}`,
        );
      }

      if (Platform.OS === 'ios') {
        Beacons.startUpdatingLocation();
      }

      const options = {
        taskName: 'BeaconTask',
        taskTitle: 'Beacon Background Task',
        taskDesc: 'Processing beacon data in the background',
        taskIcon: {
          name: 'ic_launcher',
          type: 'mipmap',
        },
        color: '#FF00FF', // Notification color (Android only)
        parameters: {
          key: 'value',
        },
      };

      // Start the app to the background
      AppState.addEventListener('change', async nextAppState => {
        if (appState.current === 'active' && nextAppState === 'background') {
          console.log('Beacons ranging should start in the BACKGROUND!');
          try {
            await BackgroundActions.start(performBackgroundTask, options);
            console.log('Background task started successfully!');
          } catch (err) {
            console.error(`Background task not started, error: ${err}`);
          }
        }
      });
    };

    startBackgroundTask();
  }, []);

  async function performBackgroundTask() {
    // Perform your background task logic here
    console.log('Running background task...');
    for (let i = 0; BackgroundActions.isRunning(); i++) {
      console.log(i);
    }
  }

  // Load data from AsyncStorage on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const deviceData = await AsyncStorage.getItem('deviceData');
        if (deviceData) {
          dispatch({type: 'SET_DEVICE', payload: JSON.parse(deviceData)});
        }
      } catch (error) {
        console.error('Error loading data from AsyncStorage:', error);
      }
    };

    loadData();
  }, []);

  // Save data to AsyncStorage whenever device changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('deviceData', JSON.stringify(state.device));
      } catch (error) {
        console.error('Error saving data to AsyncStorage:', error);
      }
    };

    saveData();
  }, [state.device]);

  // const rangeBeacons = async () => {
  //   const region = {
  //     identifier: 'ESP TAG APP',
  //     uuid: 'fda50693-a4e2-4fb1-afcf-c6eb07647825', // Why this is burned ?
  //     major: 10167,
  //     minor: 61958,
  //   };

  //   if (Platform.OS === 'android') {
  //     Beacons.detectIBeacons();
  //   } else {
  //     Beacons.requestAlwaysAuthorization();
  //     Beacons.startMonitoringForRegion(region);
  //   }

  //   try {
  //     await Beacons.startRangingBeaconsInRegion(region);
  //     console.log('Beacons ranging started succesfully!');
  //   } catch (err) {
  //     console.error(`Beacons ranging not started, error: ${err}`);
  //   }

  //   if (Platform.OS === 'ios') {
  //     Beacons.startUpdatingLocation();
  //   }
  // };

  useEffect(() => {
    DeviceEventEmitter.addListener('beaconsDidRange', ({beacons}) => {
      beacons.map((beacon: Beacon) => {
        if (
          beacon.rssi !== 0 &&
          beacon.uuid === 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825'
        ) {
          const time = new Date();
          const opciones = {
            timeZone: 'America/Mexico_City', // UTC-6
            hour12: true, // Para usar el formato de 24 horas
          };
          const fechaHoraUTC6 = time.toLocaleString('es-MX', opciones);

          console.log('RSSI: ', beacon.rssi);
          console.log('TIME: ', fechaHoraUTC6);

          const pathLossExponent = 2.0;
          const distance = Math.pow(
            10,
            (-69 - beacon.rssi) / (10 * pathLossExponent),
          );
          console.log('Distancia: ', distance);
          setCurrentDistance(distance);
        }
      });
    });

    DeviceEventEmitter.addListener('regionDidEnter', data => {
      console.log('regionDidEnter', data);
    });
    DeviceEventEmitter.addListener('regionDidExit', data => {
      console.log('regionDidExit', data);
    });
  }, []);

  return (
    <AppContext.Provider value={{state, dispatch}}>
      <Provider>
        <SafeAreaView style={styles.container}>
          <StatusBar />
          <Home currentDistance={currentDistance} />
        </SafeAreaView>
      </Provider>
    </AppContext.Provider>
  );
}

export default App;

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
