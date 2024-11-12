import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RecordingsScreen() {
  const [recordings, setRecordings] = useState([]);
  const [recording, setRecording] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRecordings();
  }, []);

  async function loadRecordings() {
    const storedRecordings = await AsyncStorage.getItem('recordings') || '[]';
    setRecordings(JSON.parse(storedRecordings));
  }

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }

  async function stopRecording() {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const newRecording = {
        id: Date.now().toString(),
        uri,
        date: new Date().toLocaleString(),
      };
      setRecording(null);
      const updatedRecordings = [...recordings, newRecording];
      setRecordings(updatedRecordings);
      await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }

  async function handleRecording() {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  async function playRecording(recording) {
    const { sound } = await Audio.Sound.createAsync({ uri: recording.uri });
    await sound.playAsync();
  }

  async function deleteRecording(id) {
    const updatedRecordings = recordings.filter((rec) => rec.id !== id);
    setRecordings(updatedRecordings);
    await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
  }

  const filteredRecordings = recordings.filter((rec) =>
    rec.date.includes(searchTerm)
  );

  const renderItem = ({ item }) => (
    <View style={styles.recordingItem}>
      <Text style={styles.recordingText}>{item.date}</Text>
      <View style={styles.recordingButtons}>
        <TouchableOpacity style={styles.playButton} onPress={() => playRecording(item)}>
          <Text style={styles.buttonText}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteRecording(item.id)}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search by date"
        placeholderTextColor="#888"
        onChangeText={setSearchTerm}
        style={styles.searchInput}
      />
      <TouchableOpacity style={styles.recordButton} onPress={handleRecording}>
        <Text style={styles.recordButtonText}>{recording ? "Stop Recording" : "New Voice Note"}</Text>
      </TouchableOpacity>
      <FlatList
        data={filteredRecordings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.recordingsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    padding: 20,
  },
  searchInput: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    color: '#fff',
    backgroundColor: '#333',
  },
  recordButton: {
    backgroundColor: '#f94144',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recordingsList: {
    marginTop: 15,
  },
  recordingItem: {
    backgroundColor: '#2c2c2c',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
  },
  recordingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});
