import { useEffect, useRef } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

// Bottom-sheet modal for create/edit forms. `onOpen` fires once each time the
// sheet becomes visible — use it to seed form state from the item being edited.
// `behavior="padding"` on the KeyboardAvoidingView lifts the sheet above the
// keyboard on both platforms (the sheet is bottom-anchored).
export function FormSheet({ visible, title, onClose, onOpen, children }) {
  const wasVisible = useRef(false)
  const insets = useSafeAreaInsets()
  useEffect(() => {
    if (visible && !wasVisible.current) onOpen?.()
    wasVisible.current = visible
  }, [visible, onOpen])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
            <ScrollView
              contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}
