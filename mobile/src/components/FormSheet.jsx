import { useEffect, useRef } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

// Bottom-sheet modal for create/edit forms. `onOpen` fires once each time the
// sheet becomes visible — use it to seed form state from the item being edited.
export function FormSheet({ visible, title, onClose, onOpen, children }) {
  const wasVisible = useRef(false)
  useEffect(() => {
    if (visible && !wasVisible.current) onOpen?.()
    wasVisible.current = visible
  }, [visible, onOpen])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="bg-white rounded-t-3xl max-h-[88%]">
            <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
              <Text className="text-lg font-bold text-slate-900">{title}</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}
