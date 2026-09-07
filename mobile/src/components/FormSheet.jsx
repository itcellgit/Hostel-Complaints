import { useEffect, useRef } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import {
  KeyboardAwareScrollView,
  KeyboardAvoidingView,
  KeyboardProvider,
} from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

// Bottom-sheet modal for create/edit forms. `onOpen` fires once each time the
// sheet becomes visible — use it to seed form state from the item being edited.
// The keyboard-controller KeyboardAvoidingView lifts the whole sheet above the
// keyboard (works on Android with edge-to-edge, unlike RN's built-in one), and
// the inner KeyboardAwareScrollView keeps the focused field in view.
export function FormSheet({ visible, title, onClose, onOpen, children }) {
  const wasVisible = useRef(false)
  const insets = useSafeAreaInsets()
  useEffect(() => {
    if (visible && !wasVisible.current) onOpen?.()
    wasVisible.current = visible
  }, [visible, onOpen])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardProvider>
        <View className="flex-1 justify-end">
          <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
          <KeyboardAvoidingView behavior="padding">
            <View
              className="bg-white rounded-t-3xl"
              style={{ maxHeight: '92%', paddingBottom: Math.max(insets.bottom, 12) }}
            >
              <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
                <Text className="text-lg font-bold text-slate-900">{title}</Text>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </Pressable>
              </View>
              <KeyboardAwareScrollView
                contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}
                keyboardShouldPersistTaps="handled"
                bottomOffset={16}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </KeyboardAwareScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </KeyboardProvider>
    </Modal>
  )
}
