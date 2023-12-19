/* eslint-disable react/react-in-jsx-scope */
import {TouchableOpacity} from 'react-native';
import styles from './styles';
import {PlusIcon} from '../../../assets/icons';

export interface ButtonProps {
  onClick: () => void;
}

export default function RoundedButtonWithIcon({onClick}: ButtonProps) {
  return (
    <TouchableOpacity style={styles.roundedButton} onPress={onClick}>
      <PlusIcon />
    </TouchableOpacity>
  );
}
