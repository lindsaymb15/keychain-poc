/* eslint-disable react/react-in-jsx-scope */
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import styles from './styles';
import {Modal, Portal, ActivityIndicator} from 'react-native-paper';
import {useHome} from './useHome';
import {Device, Header} from '../../molecules';
import {ErrorBoxImage} from '../../../assets/images';
import {
  MinusIcon,
  PlusIcon,
  ProfileIcon,
  SettingsIcon,
} from '../../../assets/icons';
import {RoundedButtonWithIcon} from '../../atoms';
import {
  COLOR_LIGHT_GRAY,
  COLOR_PRIMARY_DARK,
  COLOR_SECONDARY,
} from '../../../constants/theme';
import {useAppContext} from '../../../App/App';

export interface HomeProps {
  currentDistance: number;
}

export default function Home({currentDistance}: HomeProps) {
  const {
    compatibleDevicesModalVisible,
    hideCompatibleDevicesModal,
    showCompatibleDevicesModal,
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
  } = useHome({currentDistance});

  const {state} = useAppContext();

  return (
    <>
      <View style={styles.homeTopContainer}>
        <Header />
        <Text style={[styles.text, styles.greetingText]}>Hi User,</Text>
        <Text style={[styles.text, styles.welcomeText]}>Welcome!</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {state.device ? (
          <Device
            deviceName={state.device.name}
            alertDistance={parseInt(state.device.alertDistance, 10)}
            currentLocation={
              currentDistance <= parseInt(state.device.alertDistance, 10)
                ? 'With you'
                : `${currentDistance.toFixed(2)} meters away.`
            }
          />
        ) : (
          <>
            <ErrorBoxImage style={styles.noDevicesImage} />
            <Text style={styles.noDevicesText}>
              You haven't registered any device
            </Text>
          </>
        )}
      </ScrollView>
      <View style={styles.homeButtonsContainer}>
        {/* to do: convert to butttons */}
        <SettingsIcon />
        <View style={styles.addButtonContainer}>
          <RoundedButtonWithIcon
            onClick={showCompatibleDevicesModal}
            disabled={state.device !== null}
          />
        </View>
        <ProfileIcon />
      </View>
      {/* compatible devices modal */}
      <Portal>
        <Modal
          visible={compatibleDevicesModalVisible}
          contentContainerStyle={styles.modal}
          dismissable={false}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalText, styles.modalTitle]}>
              Compatible Devices
            </Text>
            {connectionStatus === 'Searching' ? (
              <>
                <ActivityIndicator
                  animating={true}
                  color={COLOR_SECONDARY}
                  accessibilityComponentType={undefined}
                  accessibilityTraits={undefined}
                  size={100}
                  style={styles.activityIndicator}
                />
                <Text style={[styles.modalText, styles.modalSubtitle]}>
                  Looking for devices
                </Text>
              </>
            ) : connectionStatus === 'Device found' ? (
              <>
                <View style={styles.deviceContainer}>
                  <Text style={[styles.modalText, styles.deviceName]}>
                    {compatibleDevice?.name ||
                      compatibleDevice?.localName ||
                      'PocketPal'}
                  </Text>
                  <TouchableOpacity
                    style={styles.addDeviceButton}
                    onPress={showAddDeviceModal}>
                    <Text style={[styles.modalText, styles.addButtonText]}>
                      Add
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <ErrorBoxImage
                  style={styles.modalErrorImage}
                  width={70}
                  height={79}
                  color={COLOR_SECONDARY}
                />
                <Text style={[styles.modalText, styles.notFoundText]}>
                  No compatible devices found
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={lookForDevices}>
                  <Text style={[styles.modalText, styles.modalButtonText]}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={hideCompatibleDevicesModal}>
              <Text style={[styles.modalText, styles.modalSubtitle]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>
      {/* add device modal */}
      <Portal>
        <Modal
          visible={addDeviceModalVisible}
          contentContainerStyle={styles.modal}
          dismissable={false}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalContainer, styles.addDeviceContainer]}>
              <Text style={[styles.modalText, styles.modalTitle]}>
                Add New Device
              </Text>
              <View style={styles.nameInputContainer}>
                <Text style={[styles.modalText, styles.deviceName]}>
                  Name Device
                </Text>
                <TextInput
                  style={[styles.input, styles.modalText, styles.inputText]}
                  onChangeText={setNewDeviceName}
                  value={newDeviceName}
                />
              </View>
              <View style={styles.distanceContainer}>
                <Text style={[styles.modalText, styles.deviceName]}>
                  Set Alert Distance (meters)
                </Text>
                <View style={styles.distanceControllerContainer}>
                  <TouchableOpacity
                    style={styles.distanceButton}
                    onPress={decreaseDistance}
                    disabled={newDeviceDistance === '1'}>
                    <MinusIcon
                      color={
                        newDeviceDistance === '1'
                          ? COLOR_LIGHT_GRAY
                          : COLOR_PRIMARY_DARK
                      }
                    />
                  </TouchableOpacity>
                  {/* todo: add validation */}
                  <TextInput
                    style={[
                      styles.input,
                      styles.modalText,
                      styles.distanceInput,
                    ]}
                    onChangeText={setNewDeviceDistance}
                    value={newDeviceDistance}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    style={styles.distanceButton}
                    onPress={increaseDistance}
                    disabled={newDeviceDistance === '10'}>
                    <PlusIcon
                      height={20}
                      width={20}
                      color={
                        newDeviceDistance === '10'
                          ? COLOR_LIGHT_GRAY
                          : COLOR_PRIMARY_DARK
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={hideAddDeviceModal}>
                  <Text style={[styles.modalText, styles.modalSubtitle]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalRightButton]}
                  onPress={addDevice}
                  disabled={newDeviceName === '' || newDeviceDistance === ''}>
                  <Text style={[styles.modalText, styles.modalButtonText]}>
                    Add
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>
    </>
  );
}
