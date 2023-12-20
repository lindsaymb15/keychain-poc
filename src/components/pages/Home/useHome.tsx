import {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {BleManager, Device} from 'react-native-ble-plx';
import {encode} from 'base-64';

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

export function useHome(): Hook {
  const bleManager = new BleManager();

  const [compatibleDevicesModalVisible, setCompatibleDevicesModalVisible] =
    useState(false);
  const [addDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceDistance, setNewDeviceDistance] = useState('2');

  const [compatibleDevice, setCompatibleDevice] = useState<Device>();

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

  const connectToDevice = (device: Device) => {
    bleManager
      .connectToDevice(device.id)
      .then(async () => {
        await device.discoverAllServicesAndCharacteristics();
        const services = await device.services();
        const service = services[0];
        const characteristics = await device.characteristicsForService(
          service.uuid,
        );
        const readWriteCharacteristic = characteristics[0];
        const result = await readWriteCharacteristic.writeWithResponse(
          uint16ToBase64(1),
        );
        console.log('WRITE RESULT', result);
        device.cancelConnection();
      })
      .catch(error => {
        console.log(error);
        device.cancelConnection();
      });
  };

  const lookForDevices = () => {
    setConnectionStatus('Searching');
  };

  useEffect(() => {
    if (connectionStatus === 'Searching') {
      setTimeout(function () {
        if (!compatibleDevice) {
          bleManager.stopDeviceScan();
          setConnectionStatus('Error');
        }
      }, 10000);
      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error(error);
          bleManager.stopDeviceScan();
          setConnectionStatus('Error');
          return;
        }
        if (device) {
          console.log(device?.name, device?.id, device?.localName);
        }
        if (
          device?.localName === 'ESP TAG APP' ||
          device?.name === 'ESP_TAG_POC' ||
          device?.id === 'FB23D2C2-FF7B-DE57-F0F8-7E840692BBA6'
        ) {
          console.log(device);
          bleManager.stopDeviceScan();
          setCompatibleDevice(device);
          setConnectionStatus('Device found');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus]);

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
    console.log('Adding device: ', newDeviceName);
    if (Platform.OS === 'ios') {
      bleManager.onStateChange(state => {
        if (state === 'PoweredOn' && compatibleDevice) {
          connectToDevice(compatibleDevice);
        }
      });
    } else {
      compatibleDevice && connectToDevice(compatibleDevice);
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
