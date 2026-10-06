import { useState } from 'react'
import { Alert, Image, Text } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { complaintsApi } from '../api/resources'
import { apiErrorMessage } from '../api/client'
import { FormSheet } from './FormSheet'
import { Button, Field, ErrorNote } from './ui'

// Camera or gallery → an expo-image-picker asset (or null if cancelled).
export function pickPhoto(title = 'Attach photo') {
  return new Promise((resolve) => {
    async function launch(fromCamera) {
      try {
        if (fromCamera) {
          const perm = await ImagePicker.requestCameraPermissionsAsync()
          if (!perm.granted) {
            Alert.alert('Camera permission needed', 'Allow camera access in Settings, or choose from the gallery.')
            return resolve(null)
          }
        }
        const opts = { mediaTypes: ['images'], quality: 0.6 }
        const res = fromCamera
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts)
        resolve(res.canceled ? null : res.assets[0])
      } catch (e) {
        Alert.alert('Error', apiErrorMessage(e, 'Could not open the camera'))
        resolve(null)
      }
    }
    Alert.alert(title, undefined, [
      { text: 'Take photo', onPress: () => launch(true) },
      { text: 'Choose from gallery', onPress: () => launch(false) },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ])
  })
}

// Maintainer "Mark as completed": a proof-of-work photo is mandatory.
export function MaintainerCompleteSheet({ complaint, onClose }) {
  const qc = useQueryClient()
  const [proof, setProof] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => complaintsApi.maintainerComplete(complaint.id, remarks.trim(), proof),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaints'] })
      qc.invalidateQueries({ queryKey: ['complaint', complaint.id] })
      onClose()
      Alert.alert('Done', 'Marked as completed — the facility cell will verify it.')
    },
    onError: (e) => setError(apiErrorMessage(e, 'Could not mark this task completed')),
  })

  return (
    <FormSheet
      visible={!!complaint}
      title={complaint ? `Complete ${complaint.complaintNo}` : ''}
      onClose={onClose}
      onOpen={() => {
        setProof(null)
        setRemarks('')
        setError('')
      }}
    >
      <Text className="text-sm font-medium text-slate-700">Photo of completed work (required)</Text>
      {proof ? <Image source={{ uri: proof.uri }} className="w-full h-48 rounded-xl" resizeMode="cover" /> : null}
      <Button
        title={proof ? 'Change photo' : 'Attach photo'}
        variant="ghost"
        icon="camera-outline"
        onPress={async () => {
          const p = await pickPhoto('Photo of completed work')
          if (p) setProof(p)
        }}
      />
      <Field label="Remarks (optional)" value={remarks} onChangeText={setRemarks} multiline />
      <ErrorNote message={error} />
      <Button
        title="Mark as completed"
        icon="checkmark-circle-outline"
        loading={mutation.isPending}
        disabled={!proof}
        onPress={() => mutation.mutate()}
      />
    </FormSheet>
  )
}
