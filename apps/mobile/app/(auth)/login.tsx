import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { Truck } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(auth)/teams');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header - Logo */}
      <View className="absolute top-0 left-0 z-30 w-full">
        <SafeAreaView edges={['top']}>
          <View className="p-6">
            <View className="flex-row items-center">
              <Truck size={32} color="#020817" />
              <Text className="text-2xl font-bold ml-2 text-gray-900">TOCLD</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Layout */}
      <View className="flex-1">
        {/* Background Section - Dirt brown gradient */}
        <View className="absolute top-0 left-0 right-0 h-2/5 bg-orange-900 opacity-10" />
        
        {/* Login Form Section */}
        <SafeAreaView className="flex-1" edges={['bottom']}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="flex-1 justify-center px-6">
              <View className="max-w-md w-full mx-auto">
                {/* Welcome Section */}
                <View className="text-center mb-8">
                  <Text className="text-2xl font-bold text-gray-900 mb-2">
                    {isSignUp ? 'Create Your Account' : 'Welcome Back'}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {isSignUp 
                      ? 'Sign up to start managing your jobs'
                      : 'Sign in to your account to continue'}
                  </Text>
                </View>

                {/* Form */}
                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Email
                    </Text>
                    <TextInput
                      className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                      placeholder="admin@tocld.com"
                      placeholderTextColor="#9ca3af"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Password
                    </Text>
                    <TextInput
                      className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                      placeholder="Enter password"
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      editable={!loading}
                    />
                  </View>

                  <Pressable
                    className={`w-full h-12 bg-gray-900 rounded-lg items-center justify-center mt-6 ${
                      loading ? 'opacity-50' : 'active:bg-gray-800'
                    }`}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    <Text className="text-white font-semibold text-base">
                      {loading 
                        ? (isSignUp ? 'Creating account...' : 'Signing in...')
                        : (isSignUp ? 'Create Account' : 'Sign In')}
                    </Text>
                  </Pressable>

                  {/* Toggle Sign Up / Sign In */}
                  <View className="text-center mt-4">
                    <Pressable
                      onPress={() => setIsSignUp(!isSignUp)}
                      className="py-2"
                    >
                      <Text className="text-sm text-gray-600 text-center">
                        {isSignUp 
                          ? 'Already have an account? Sign in'
                          : "Don't have an account? Sign up"}
                      </Text>
                    </Pressable>
                    
                    <Pressable className="py-2">
                      <Text className="text-sm text-gray-600 text-center underline">
                        Forgot your password?
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Terms and Privacy */}
                <View className="absolute bottom-4 left-0 right-0">
                  <Text className="text-xs text-gray-500 text-center">
                    By signing in you agree to our Terms of Service & Privacy Policy
                  </Text>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
}