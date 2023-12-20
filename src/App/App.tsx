import React from 'react';
import {
  DeviceEventEmitter,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useEffect} from 'react';
import styles from './styles';
import {Provider} from 'react-native-paper';
import {Home} from '../components/pages';
import Beacons from 'react-native-beacons-manager';

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
  useEffect(() => {
    requestBluetoothPermission();
    rangeBeacons();
  }, []);

  const rangeBeacons = async () => {
    const region = {
      identifier: 'ESP TAG APP',
      uuid: 'fda50693-a4e2-4fb1-afcf-c6eb07647825',
      major: 10167,
      minor: 61958,
    };

    if (Platform.OS === 'android') {
      Beacons.detectIBeacons();
    } else {
      Beacons.requestAlwaysAuthorization();
      Beacons.startMonitoringForRegion(region);
    }

    try {
      await Beacons.startRangingBeaconsInRegion(region);
      console.log('Beacons ranging started succesfully!');
    } catch (err) {
      console.log(`Beacons ranging not started, error: ${err}`);
    }

    if (Platform.OS === 'ios') {
      Beacons.startUpdatingLocation();
    }
  };

  useEffect(() => {
    DeviceEventEmitter.addListener('beaconsDidRange', data => {
      data.beacons.map((beacon: Beacon) => {
        if (
          beacon.accuracy > 0 &&
          beacon.uuid === 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825'
        ) {
          const distance = Math.pow(10, (-69 - beacon.rssi) / (10 * 2));
          console.log('Distance', distance);
          console.log('Accuracy', beacon.accuracy);
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
    <Provider>
      <SafeAreaView style={styles.container}>
        <StatusBar />
        <Home />
      </SafeAreaView>
    </Provider>
  );
}

export default App;
