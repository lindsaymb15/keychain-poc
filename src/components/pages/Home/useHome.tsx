import {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {BleManager, Characteristic, Device} from 'react-native-ble-plx';
import {encode} from 'base-64';
import {useAppContext} from '../../../App/App';

interface HomeProps {
  currentDistance: number;
}

interface Hook {
  compatibleDevicesModalVisible: boolean;
  showCompatibleDevicesModal: () => void;
  hideCompatibleDevicesModal: () => void;
  addDeviceModalVisible: boolean;
  showAddDeviceModal: () => void;
  hideAddDeviceModal: () => void;
  connectionStatus: string;
  newDeviceName: string;
  setNewDeviceName: any;
  lookForDevices: () => void;
  addDevice: () => void;
  newDeviceDistance: string;
  setNewDeviceDistance: any;
  increaseDistance: () => void;
  decreaseDistance: () => void;
  compatibleDevice?: Device;
}

export function useHome({currentDistance}: HomeProps): Hook {
  const bleManager = new BleManager();

  const {state: contextState, dispatch} = useAppContext();

  const handleSaveDevice = (readWriteCharacteristic: Characteristic) => {
    dispatch({
      type: 'SET_DEVICE',
      payload: {
        device: compatibleDevice,
        alertDistance: newDeviceDistance,
        name: newDeviceName,
        rwCharacteristic: readWriteCharacteristic,
      },
    });
  };

  const [compatibleDevicesModalVisible, setCompatibleDevicesModalVisible] =
    useState(false);
  const [addDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceDistance, setNewDeviceDistance] = useState('2');

  const [compatibleDevice, setCompatibleDevice] = useState<Device>();

  // const [isAlerted, setIsAlerted] = useState(false);

  function uint16ToBase64(uint16Value: number) {
    // Convert Uint16 to Uint8Array
    const uint8Array = new Uint8Array([
      // eslint-disable-next-line no-bitwise
      uint16Value & 0xff,
      // eslint-disable-next-line no-bitwise
      (uint16Value >> 8) & 0xff,
    ]);
    // Convert Uint8Array to binary string
    let binaryString = '';
    uint8Array.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });
    // Convert binary string to Base64
    const base64String = encode(binaryString);
    return base64String;
  }

  const connectToDevice = (
    device: Device,
    sendAlert: boolean,
    isAlertTurnOn = true,
  ) => {
    bleManager
      .connectToDevice(device.id)
      .then(async connDevice => {
        try {
          console.log('device connected');
          await connDevice.discoverAllServicesAndCharacteristics();
          const services = await connDevice.services();
          const service = services[0];
          const characteristics = await connDevice.characteristicsForService(
            service.uuid,
          );
          const readWriteCharacteristic = characteristics[0];
          if (!sendAlert) {
            handleSaveDevice(readWriteCharacteristic);
          }
          if (sendAlert) {
            ///Ponerlos en una cola de 20//
            //si el promedio es > 85 esta lejos enciende la luz
            const writeValue = isAlertTurnOn //Enciende/Apaga la luz de distancia , azul
              ? uint16ToBase64(1)
              : uint16ToBase64(0);
            readWriteCharacteristic
              .writeWithResponse(writeValue)
              .then(() => connDevice.cancelConnection())
              .catch(err => {
                console.log(err);
                connDevice.cancelConnection();
              });
          }
          // else {
          //   connDevice.cancelConnection();
          // }
        } catch (error) {
          console.log('DESCONECTADO - 1');
          console.log(error);
          // connDevice.cancelConnection;
        }
      })
      .catch(error => {
        console.log('DESCONECTADO - 2');
        console.log(error);
      });
  };

  const alertDevice = async () => {
    const device = contextState.device?.device;
    const deviceId = contextState.device?.device?.id;
    // console.log(
    //   '🚀 ~ file: useHome.tsx:140 ~ alertDevice ~ alertDevice:',
    //   'alertDevice',
    // );

    // if (device && deviceId) {
    //   const subscription = bleManager.onStateChange(state => {
    //     if (state === 'PoweredOn') {
    //       console.log(
    //         '🚀 ~ file: useHome.tsx:128 ~ subscription ~ emit:',
    //         'emit',
    //       );
    //       connectToDevice(device, true);
    //       subscription.remove();
    //     }
    //   }, true);
    // }
  };

  const lookForDevices = () => {
    setConnectionStatus('Searching');
  };

  useEffect(() => {
    // console.log(
    //   '🚀 ~ file: useHome.tsx:144 ~ currentDistance:',
    //   currentDistance,
    // );
    if (
      contextState.device &&
      currentDistance > parseInt(contextState.device.alertDistance, 10)
    ) {
      contextState.device.device && alertDevice();
    }
    // else if (
    //   contextState.device &&
    //   isAlerted &&
    //   currentDistance < parseInt(contextState.device.alertDistance, 10)
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDistance, contextState.device]);

  useEffect(() => {
    if (connectionStatus === 'Searching') {
      const subscription = bleManager.onStateChange(state => {
        if (state === 'PoweredOn') {
          scanAndConnect();
          subscription.remove();
        }
      }, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus]);

  const scanAndConnect = () => {
    setTimeout(function () {
      if (!compatibleDevice) {
        bleManager.stopDeviceScan();
        setConnectionStatus('Error');
      }
    }, 10000);
    bleManager.startDeviceScan(null, null, (error, device) => {
      console.log(
        '🚀 ~ file: useHome.tsx:188 ~ bleManager.startDeviceScan ~ device:',
        device,
      );
      if (error) {
        console.error(error);
        bleManager.stopDeviceScan();
        setConnectionStatus('Error');
        return;
      }
      if (
        device?.localName === 'ESP TAG APP' ||
        device?.name === 'ESP_TAG_POC' ||
        device?.id === 'FB23D2C2-FF7B-DE57-F0F8-7E840692BBA6'
      ) {
        bleManager.stopDeviceScan();
        setCompatibleDevice(device);
        setConnectionStatus('Device found');
      }
    });
  };

  const showCompatibleDevicesModal = () => {
    lookForDevices();
    setCompatibleDevicesModalVisible(true);
  };

  const hideCompatibleDevicesModal = () =>
    setCompatibleDevicesModalVisible(false);

  const showAddDeviceModal = () => {
    hideCompatibleDevicesModal();
    setNewDeviceName(
      compatibleDevice?.localName || compatibleDevice?.name || 'My PocketPal',
    );
    setNewDeviceDistance('2');
    setAddDeviceModalVisible(true);
  };

  const hideAddDeviceModal = () => setAddDeviceModalVisible(false);

  const addDevice = () => {
    if (Platform.OS === 'ios') {
      const subscription = bleManager.onStateChange(state => {
        if (state === 'PoweredOn' && compatibleDevice) {
          connectToDevice(compatibleDevice, false);
          subscription.remove();
        }
      }, true);
    } else {
      compatibleDevice && connectToDevice(compatibleDevice, false);
    }
    hideAddDeviceModal();
  };

  const increaseDistance = () => {
    const distance = parseInt(newDeviceDistance, 10) + 1;
    setNewDeviceDistance(distance.toString());
  };

  const decreaseDistance = () => {
    const distance = parseInt(newDeviceDistance, 10) - 1;
    setNewDeviceDistance(distance.toString());
  };

  return {
    compatibleDevicesModalVisible,
    showCompatibleDevicesModal,
    hideCompatibleDevicesModal,
    addDeviceModalVisible,
    showAddDeviceModal,
    hideAddDeviceModal,
    connectionStatus,
    newDeviceName,
    setNewDeviceName,
    lookForDevices,
    addDevice,
    newDeviceDistance,
    setNewDeviceDistance,
    increaseDistance,
    decreaseDistance,
    compatibleDevice,
  };
}
