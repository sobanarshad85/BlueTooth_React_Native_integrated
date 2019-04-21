/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, Button, TouchableOpacity, PermissionsAndroid } from 'react-native';
import BluetoothSerial from 'react-native-bluetooth-serial'
const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

type Props = {};
export default class App extends Component<Props> {
  constructor() {
    super();
    this.state = {
      devices: [],
      unpairedDevices: [],
      isEnabled: false,
      discovering: false
    }
  }

  componentDidMount() {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
        if (result) {
          console.warn("Permission is OK");
        } else {
          PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
            if (result) {
              console.warn("User accept");
            } else {
              console.warn("User refuse");
            }
          });
        }
      });
    }

  }

  componentWillMount() {
    this.discoverUnpaired()
    Promise.all([BluetoothSerial.isEnabled(), BluetoothSerial.list()]).then(
      values => {
        const [isEnabled, devices] = values;
        this.setState({ isEnabled, devices, devicesFormatted });
      }
    );

    BluetoothSerial.on("bluetoothEnabled", () => {
      console.warn("Bluetooth enabled")
      this.setState({ isEnabled: true })
    }
    );

    BluetoothSerial.on("bluetoothDisabled", () => {
      console.warn("Bluetooth disabled")
      this.setState({ isEnabled: false })
    }
    );

    BluetoothSerial.on("error", err => {
      console.warn("error", err);
    });

    BluetoothSerial.on("connectionLost", () => {
      if (this.state.device) {
        this.connect(this.state.device)
          .then(res => { })
          .catch(err => {
            console.warn("error", err);
          });
      }
    });
  }

  toggleBluetooth = (value) => {
    if (value === true) {
      this.disable()
    } else {
      this.enable()
    }
  }

  enable = () => {
    BluetoothSerial.enable()
      .then((res) => this.setState({ isEnabled: true }))
      .catch((err) => console.warn(err.message))
  }

  disable = () => {
    BluetoothSerial.disable()
      .then((res) => this.setState({ isEnabled: false }))
      .catch((err) => console.warn(err.message))
  }

  discoverUnpaired = () => {
    if (this.state.discover) {
      console.warn('Hey')
      return false
    } else {
      console.warn('Begin')
      this.setState({ discover: true })
      BluetoothSerial.discoverUnpairedDevices()
        .then((unpairedDevices) => {
          this.setState({ unpairedDevices, discover: false })
          console.warn('unprd: ' + this.state.unpairedDevices)
        })
        .catch((err) => alert('Error'))
    }
  }

  pairDevice = (device) => {
    BluetoothSerial.pairDevice(device.id)
      .then((paired) => {
        if (paired) {
          console.warn(`Device ${device.name} paired successfully`)
          const devices = this.state.devices
          devices.push(device)
          this.setState({ devices, unpairedDevices: this.state.unpairedDevices.filter((d) => d.id !== device.id) })
        } else {
          console.warn(`Device ${device.name} pairing failed`)
        }
      })
      .catch((err) => console.warn(err.message))
  }

  cancelDiscovery = () => {
    if (this.state.discovering) {
      BluetoothSerial.cancelDiscovery()
        .then(() => {
          this.setState({ discovering: false })
        })
        .catch((err) => console.warn(err.message))
    }
  }

  connect = (device) => {
    this.setState({ connecting: true })
    BluetoothSerial.connect(device.id)
      .then((res) => {
        Toast.showShortBottom(`Connected to device ${device.name}`)
        this.setState({ device, connected: true, connecting: false })
      })
      .catch((err) => console.warn(err.message))
  }

  disconnect = () => {
    BluetoothSerial.disconnect()
      .then(() => this.setState({ connected: false }))
      .catch((err) => console.warn(err.message))
  }

  toggleConnect = (value) => {
    if (value === true && this.state.device) {
      this.connect(value)
    } else {
      this.disconnect()
    }
  }

  render() {
    return (
      <View style={styles.container}>

        <View style={{ marginTop: 10 }}>
          <Button title="Toggle Bluetooth" onPress={() => this.toggleBluetooth(this.state.isEnabled)} />
        </View>
        <View style={{ marginTop: 10 }}>
          <Button title="Enable Bluetooth" onPress={this.enable} />
        </View>
        <View style={{ marginTop: 10 }}>
          <Button title="Disable Bluetooth" onPress={this.disable} />
        </View>
        <View style={{ marginTop: 10 }}>
          <Button title="Discover Unpaired" onPress={this.discoverUnpaired} />
        </View>
        {/* <TouchableOpacity onPress={() => this.toggleBluetooth(this.state.isEnabled)}>
          <Text>toggleBluetooth</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.enable}>
          <Text>enable</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.disable}>
          <Text>disable</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.discoverUnpaired}>
          <Text>discoverUnpaired</Text>
        </TouchableOpacity> */}

        {
          this.state.unpairedDevices.map((device) => {
            return (
              <TouchableOpacity onPress={() => this.connect(device)}>
                <Text>{device.name}</Text>
              </TouchableOpacity>
            )
          })
        }
        <Text style={styles.welcome}>{this.state.device}</Text>
        <Text style={styles.instructions}>To get started, edit .js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
