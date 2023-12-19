import {useState} from 'react';
import {Platform} from 'react-native';
import {BleManager, Device} from 'react-native-ble-plx';

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

  const connectToDevice = (device: Device) => {
    bleManager
      .connectToDevice(device.id, {
        refreshGatt: 'OnConnected',
      })
      .then(connDevice => {
        console.log(connDevice);
        console.log(connDevice.id);
        console.log(connDevice.name);
        // return;
        // console.log(device.characteristicsForService())
        // bleManager.discoverAllServicesAndCharacteristicsForDevice(
        //   connDevice.id,
        // );
      });
    // device
    //   .connect()
    //   // eslint-disable-next-line @typescript-eslint/no-shadow
    //   .then(async device => {
    //     console.log('device connected!', device);
    //     setConnectionStatus('Connected');
    //     await device.discoverAllServicesAndCharacteristics();
    //     const services = await device.services();
    //     return services;
    //   })
    //   .then(services => {
    //     let service = services.find(
    //       // eslint-disable-next-line @typescript-eslint/no-shadow
    //       service => service.uuid === '00000200-0000-1000-8000-00805f9b34fb',
    //     );
    //     return service?.characteristics();
    //   })
    //   .then(characteristics => {
    //     console.log(characteristics);
    //   })
    //   .catch(error => {
    //     console.log(error);
    //     setConnectionStatus('Error');
    //   })
  };

  // useEffect(() => {
  //   console.log(compatibleDevice);
  // }, [compatibleDevice]);

  const lookForDevices = () => {
    setConnectionStatus('Searching');
    setTimeout(function () {
      if (!compatibleDevice) {
        bleManager.stopDeviceScan();
        setConnectionStatus('Error');
      }
    }, 10000);
    bleManager.startDeviceScan(null, null, (error, device) => {
      // console.log(device);
      if (error) {
        console.error(error);
        bleManager.stopDeviceScan();
        setConnectionStatus('Error');
        return;
      }
      if (device?.localName === 'ESP TAG APP') {
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
