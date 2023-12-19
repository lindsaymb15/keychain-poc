import React from 'react';
import {
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useEffect} from 'react';
import styles from './styles';
import {Provider} from 'react-native-paper';
import {Home} from '../components/pages';

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

function App(): React.JSX.Element {
  useEffect(() => {
    requestBluetoothPermission();
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

// import React, {useEffect} from 'react';
// import {
//   Alert,
//   DeviceEventEmitter,
//   NativeEventEmitter,
//   Platform,
//   PermissionsAndroid,
//   SafeAreaView,
//   StatusBar,
// } from 'react-native';

// import {Provider} from 'react-native-paper';
// import styles from './styles';
// import {Home} from '../components/pages';

// import Kontakt, {KontaktModule} from 'react-native-kontaktio';
// import {IBEACON} from 'react-native-kontaktio/lib/configurations';
// const {connect, init, startRangingBeaconsInRegion, startScanning} = Kontakt;

// const kontaktEmitter = new NativeEventEmitter(KontaktModule);

// const isAndroid = Platform.OS === 'android';

// const beaconSetup = async () => {
//   if (isAndroid) {
//     // Android
//     const granted = await requestBluetoothPermission();
//     if (granted) {
//       connect('', [IBEACON])
//         .then(() => startScanning())
//         .catch((error: Error) => console.log('error', error));
//     } else {
//       Alert.alert(
//         'Permission error',
//         'Location permission not granted. Cannot scan for beacons',
//         [{text: 'OK', onPress: () => console.log('OK Pressed')}],
//         {cancelable: false},
//       );
//     }
//   } else {
//     // iOS
//     await init();

//     /**
//      * Will discover Kontakt.io beacons only
//      */
//     // await startDiscovery();

//     /**
//      * Works with any beacon(also virtual beacon, e.g. https://github.com/timd/MactsAsBeacon)
//      * Requires user to allow GPS Location (at least while in use)
//      *
//      * change to match your beacon values
//      */
//     await startRangingBeaconsInRegion({
//       identifier: '',
//       uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825',
//       major: 10167,
//       minor: 61958,
//     });
//   }

//   // Add beacon listener
//   if (isAndroid) {
//     /* works with any beacon */
//     DeviceEventEmitter.addListener('beaconsDidUpdate', ({beacons, region}) => {
//       console.log('beaconsDidUpdate', {beacons, region});
//     });
//   } else {
//     /* works with Kontakt.io beacons only */
//     // kontaktEmitter.addListener('didDiscoverDevices', ({beacons}) => {
//     //   console.log('didDiscoverDevices', {beacons});
//     // });

//     /* works with any beacon */
//     kontaktEmitter.addListener('didRangeBeacons', ({beacons, region}) => {
//       console.log('didRangeBeacons', {beacons, region});
//     });
//   }
// };

// function App(): React.JSX.Element {
//   useEffect(() => {
//     Promise.resolve().then(beaconSetup);

//     return () => {
//       // remove event listeners
//       if (isAndroid) {
//         // kontaktEmitter.removeAllListeners('beaconsDidUpdate');
//       } else {
//         // kontaktEmitter.removeAllListeners('didDiscoverDevices');
//         kontaktEmitter.removeAllListeners('didRangeBeacons');
//       }
//     };
//   }, []);

//   return (
//     <Provider>
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor="white" />
//         <Home />
//       </SafeAreaView>
//     </Provider>
//   );
// }

export default App;
