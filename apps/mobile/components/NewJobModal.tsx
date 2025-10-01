import { View, Text, Modal, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTRPC } from '../lib/trpc';
import { X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NewJobModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MATERIAL_OPTIONS = [
  'Dry Clean Fill',
  'Wet Fill',
  'Rock',
  'Sand',
  'Topsoil',
  'Clay',
  'Gravel',
  'Concrete',
  'Asphalt',
  'Mixed',
  'Other',
];

export function NewJobModal({ visible, onClose, onSuccess }: NewJobModalProps) {
  const trpc = useTRPC();
  const [rego, setRego] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Search for customers as user types company name
  const { data: customers = [] } = useQuery({
    queryKey: ['trpc', 'customers.search', { query: companyName }],
    queryFn: () => companyName.length > 2 
      ? trpc.customers.search.query({ query: companyName })
      : Promise.resolve([]),
    enabled: companyName.length > 2,
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: (params: any) => trpc.job.create.mutate(params),
    onSuccess: () => {
      Alert.alert('Success', 'Job created successfully');
      resetForm();
      onSuccess();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create job');
    },
  });

  const resetForm = () => {
    setRego('');
    setCompanyName('');
    setAddress('');
    setMaterialType('');
    setSelectedCustomerId(null);
  };

  const handleSubmit = async () => {
    if (!rego || !companyName || !address || !materialType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    await createJobMutation.mutateAsync({
      rego: rego.toUpperCase(),
      companyName,
      address,
      materialType,
      customerId: selectedCustomerId,
      status: 'pending',
      date: new Date().toISOString(),
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Text className="text-xl font-semibold">New Job Entry</Text>
          <Pressable onPress={onClose} className="p-2">
            <X size={24} color="#020817" />
          </Pressable>
        </View>

        {/* Form */}
        <ScrollView className="flex-1 px-4 py-4">
          <View className="space-y-4">
            {/* Rego */}
            <View>
              <Text className="text-sm font-medium mb-2">Rego *</Text>
              <TextInput
                className="w-full h-12 px-3 bg-background border border-input rounded-lg"
                placeholder="Enter truck registration"
                value={rego}
                onChangeText={setRego}
                autoCapitalize="characters"
              />
            </View>

            {/* Company Name */}
            <View>
              <Text className="text-sm font-medium mb-2">Company Name *</Text>
              <TextInput
                className="w-full h-12 px-3 bg-background border border-input rounded-lg"
                placeholder="Enter company name"
                value={companyName}
                onChangeText={(text) => {
                  setCompanyName(text);
                  setSelectedCustomerId(null);
                }}
              />
              
              {/* Customer suggestions */}
              {customers.length > 0 && (
                <View className="mt-2 border border-input rounded-lg">
                  {customers.slice(0, 3).map((customer: any) => (
                    <Pressable
                      key={customer.id}
                      className="p-3 border-b border-input"
                      onPress={() => {
                        setCompanyName(customer.name);
                        setSelectedCustomerId(customer.id);
                        setAddress(customer.address || '');
                      }}
                    >
                      <Text className="font-medium">{customer.name}</Text>
                      {customer.address && (
                        <Text className="text-sm text-muted-foreground">
                          {customer.address}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Address */}
            <View>
              <Text className="text-sm font-medium mb-2">Address *</Text>
              <TextInput
                className="w-full h-12 px-3 bg-background border border-input rounded-lg"
                placeholder="Enter job address"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* Material Type */}
            <View>
              <Text className="text-sm font-medium mb-2">Material Type *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {MATERIAL_OPTIONS.map((option) => (
                    <Pressable
                      key={option}
                      className={`px-4 py-2 rounded-lg border ${
                        materialType === option
                          ? 'bg-primary border-primary'
                          : 'bg-background border-input'
                      }`}
                      onPress={() => setMaterialType(option)}
                    >
                      <Text
                        className={
                          materialType === option
                            ? 'text-white font-medium'
                            : 'text-foreground'
                        }
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View className="px-4 py-3 border-t border-border">
          <Pressable
            className={`w-full h-12 rounded-lg items-center justify-center ${
              createJobMutation.isPending ? 'bg-primary/50' : 'bg-primary active:bg-primary/90'
            }`}
            onPress={handleSubmit}
            disabled={createJobMutation.isPending}
          >
            <Text className="text-white font-semibold text-base">
              {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}