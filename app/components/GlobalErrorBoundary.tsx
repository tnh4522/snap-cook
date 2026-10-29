import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertOctagon, RotateCcw } from 'lucide-react-native';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected UI error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('GlobalErrorBoundary caught an error:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 items-center justify-center bg-slate-950 px-6">
          <View className="w-full max-w-sm items-center rounded-3xl border border-red-500/30 bg-slate-900 p-6">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15">
              <AlertOctagon size={32} color="#f87171" />
            </View>
            <Text className="text-center text-xl font-extrabold text-white">
              Something went wrong
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-slate-400">
              {this.state.errorMessage}
            </Text>
            <Pressable
              onPress={this.handleRetry}
              className="mt-6 flex-row items-center rounded-2xl bg-emerald-500 px-6 py-3 active:opacity-85"
            >
              <RotateCcw size={16} color="#022c22" />
              <Text className="ml-2 text-sm font-bold text-slate-950">
                Try Again
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
