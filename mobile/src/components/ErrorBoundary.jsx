import { Component } from 'react'
import { ScrollView, Text, View } from 'react-native'

// Plain RN styles (no NativeWind) so this still renders even if styling or
// anything else is broken. Turns a white screen into the actual error.
export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#450a0a' }}
        contentContainerStyle={{ padding: 24, paddingTop: 80 }}
      >
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
          Something crashed
        </Text>
        <Text style={{ color: '#fecaca', fontFamily: 'monospace' }}>
          {String(this.state.error?.message || this.state.error)}
        </Text>
        <Text style={{ color: '#fca5a5', marginTop: 16, fontSize: 12 }}>
          {this.state.error?.stack}
        </Text>
      </ScrollView>
    )
  }
}
