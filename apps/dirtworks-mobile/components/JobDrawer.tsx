import { 
  View, 
  Text, 
  Modal, 
  Pressable, 
  TextInput, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
  Dimensions,
  PanResponder
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '../lib/trpc';
import { X, Calendar, MapPin, User, Phone, Truck, Package, DollarSign, Info, Plus } from 'lucide-react-native';
import { format } from 'date-fns';

interface JobDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EQUIPMENT_OPTIONS = [
  { value: 'Truck & Trailer 22m3', label: 'Truck & Trailer 22m3', capacity: 22 },
  { value: 'Truck & Quad 26m3', label: 'Truck & Quad 26m3', capacity: 26 },
  { value: 'Tandem 10m3', label: 'Tandem 10m3', capacity: 10 },
  { value: 'Single Truck', label: 'Single Truck', capacity: 8 },
  { value: 'Other', label: 'Other', capacity: null },
];

const MATERIAL_OPTIONS = [
  { value: 'Dry Clean Fill', label: 'Dry Clean Fill', defaultPrice: 85.00 },
  { value: 'Wet Fill', label: 'Wet Fill', defaultPrice: 75.00 },
  { value: 'Rock', label: 'Rock', defaultPrice: 95.00 },
  { value: 'Sand', label: 'Sand', defaultPrice: 80.00 },
  { value: 'Topsoil', label: 'Topsoil', defaultPrice: 90.00 },
  { value: 'Clay', label: 'Clay', defaultPrice: 70.00 },
  { value: 'Mixed Waste', label: 'Mixed Waste', defaultPrice: 110.00 },
  { value: 'Other', label: 'Other', defaultPrice: null },
];

export function JobDrawer({ visible, onClose, onSuccess }: JobDrawerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const screenHeight = Dimensions.get('window').height;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  
  // Form state
  const [companyName, setCompanyName] = useState('');
  const [rego, setRego] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [addressSite, setAddressSite] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [cubicMetreCapacity, setCubicMetreCapacity] = useState('');
  const [notes, setNotes] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  // Query customers for search
  const { data: customersData } = useQuery(
    trpc.customers.get.queryOptions(
      { q: customerSearch, pageSize: 10 },
      {
        enabled: customerSearch.length > 2 && showCustomerSearch,
      }
    )
  );

  // Create job mutation
  const createJobMutation = useMutation(
    trpc.job.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'trpc' && 
                   queryKey[1] && 
                   queryKey[1].toString().startsWith('job.');
          },
        });
        Alert.alert('Success', 'Job created successfully');
        resetForm();
        onSuccess();
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to create job');
      },
    })
  );

  // Animate drawer
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const resetForm = () => {
    setCompanyName('');
    setRego('');
    setJobNumber('');
    setContactPerson('');
    setContactNumber('');
    setAddressSite('');
    setEquipmentType('');
    setMaterialType('');
    setPricePerUnit('');
    setCubicMetreCapacity('');
    setNotes('');
    setCustomerId(null);
    setCustomerSearch('');
    setShowCustomerSearch(false);
  };

  const handleSubmit = () => {
    if (!companyName || !rego) {
      Alert.alert('Error', 'Please fill in required fields (Company and Rego)');
      return;
    }

    const jobData = {
      customerId,
      companyName,
      rego: rego.toUpperCase(),
      jobNumber,
      contactPerson,
      contactNumber,
      addressSite,
      equipmentType,
      materialType,
      pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : undefined,
      cubicMetreCapacity: cubicMetreCapacity ? parseInt(cubicMetreCapacity) : undefined,
      jobDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'delivered',
      notes,
      loadNumber: 1,
    };

    setPendingData(jobData);
    setShowConfirmation(true);
  };

  const handleConfirmCreate = async () => {
    setShowConfirmation(false);
    await createJobMutation.mutateAsync(pendingData);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Animated.View 
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '85%',
              transform: [{ translateY: slideAnim }],
            },
          ]}
          className="bg-white rounded-t-3xl"
        >
          <SafeAreaView className="flex-1" edges={['bottom']}>
            <KeyboardAvoidingView 
              className="flex-1"
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Handle Bar */}
              <View className="items-center py-2">
                <View className="w-12 h-1 bg-gray-300 rounded-full" />
              </View>

              {/* Header */}
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
                <Text className="text-xl font-bold text-gray-900">New Job Entry</Text>
                <Pressable onPress={onClose} className="p-2">
                  <X size={24} color="#020817" />
                </Pressable>
              </View>

              {/* Form */}
              <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
                <View className="space-y-4 pb-20">
                  {/* Customer/Company */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Customer *</Text>
                    <View className="relative">
                      <TextInput
                        className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                        placeholder="Search for customer or type new name"
                        value={companyName}
                        onChangeText={(text) => {
                          setCompanyName(text);
                          setCustomerSearch(text);
                          setShowCustomerSearch(true);
                        }}
                        onFocus={() => setShowCustomerSearch(true)}
                      />
                      
                      {/* Customer suggestions dropdown */}
                      {showCustomerSearch && customerSearch && customersData?.data && customersData.data.length > 0 && (
                        <View className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                          <ScrollView>
                            {customersData.data.map((customer: any) => (
                              <Pressable
                                key={customer.id}
                                className="p-3 border-b border-gray-100 active:bg-gray-50"
                                onPress={() => {
                                  setCustomerId(customer.id);
                                  setCompanyName(customer.name);
                                  setShowCustomerSearch(false);
                                }}
                              >
                                <Text className="font-medium text-gray-900">{customer.name}</Text>
                                {customer.email && (
                                  <Text className="text-xs text-gray-500">{customer.email}</Text>
                                )}
                              </Pressable>
                            ))}
                            <Pressable
                              className="p-3 bg-gray-50 flex-row items-center"
                              onPress={() => {
                                setShowCustomerSearch(false);
                              }}
                            >
                              <Plus size={16} color="#6b7280" />
                              <Text className="ml-2 text-gray-600">Create "{customerSearch}" as new customer</Text>
                            </Pressable>
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Rego */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Rego *</Text>
                    <TextInput
                      className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-lg font-medium"
                      placeholder="ABC-123"
                      value={rego}
                      onChangeText={setRego}
                      autoCapitalize="characters"
                    />
                  </View>

                  {/* Job Number and Date Row */}
                  <View className="flex-row space-x-3">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Job Number</Text>
                      <TextInput
                        className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                        placeholder="JOB-2024-001"
                        value={jobNumber}
                        onChangeText={setJobNumber}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Date</Text>
                      <View className="h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg justify-center">
                        <Text className="text-gray-900">{format(new Date(), 'PPP')}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Contact Person and Number Row */}
                  <View className="flex-row space-x-3">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Contact Person</Text>
                      <TextInput
                        className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                        placeholder="John Smith"
                        value={contactPerson}
                        onChangeText={setContactPerson}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Contact Number</Text>
                      <TextInput
                        className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                        placeholder="0412 345 678"
                        value={contactNumber}
                        onChangeText={setContactNumber}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  {/* Address/Site */}
                  <View>
                    <View className="flex-row items-center mb-2">
                      <Text className="text-sm font-semibold text-gray-700">Address/Site</Text>
                      <View className="ml-2">
                        <Info size={16} color="#9ca3af" />
                      </View>
                    </View>
                    <TextInput
                      className="w-full h-24 px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                      placeholder="123 Main St, Sydney NSW 2000"
                      value={addressSite}
                      onChangeText={setAddressSite}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Equipment Type */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Equipment Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row space-x-2">
                        {EQUIPMENT_OPTIONS.map((option) => (
                          <Pressable
                            key={option.value}
                            className={`px-4 py-2 rounded-lg border ${
                              equipmentType === option.value
                                ? 'bg-gray-900 border-gray-900'
                                : 'bg-white border-gray-300'
                            }`}
                            onPress={() => {
                              setEquipmentType(option.value);
                              if (option.capacity) {
                                setCubicMetreCapacity(option.capacity.toString());
                              }
                            }}
                          >
                            <Text
                              className={
                                equipmentType === option.value
                                  ? 'text-white font-medium'
                                  : 'text-gray-700'
                              }
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Material Type */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Material Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row space-x-2">
                        {MATERIAL_OPTIONS.map((option) => (
                          <Pressable
                            key={option.value}
                            className={`px-4 py-2 rounded-lg border ${
                              materialType === option.value
                                ? 'bg-gray-900 border-gray-900'
                                : 'bg-white border-gray-300'
                            }`}
                            onPress={() => {
                              setMaterialType(option.value);
                              if (option.defaultPrice) {
                                setPricePerUnit(option.defaultPrice.toString());
                              }
                            }}
                          >
                            <Text
                              className={
                                materialType === option.value
                                  ? 'text-white font-medium'
                                  : 'text-gray-700'
                              }
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Price and Capacity Row */}
                  <View className="flex-row space-x-3">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Price per Unit ($)</Text>
                      <TextInput
                        className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                        placeholder="85.00"
                        value={pricePerUnit}
                        onChangeText={setPricePerUnit}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Cubic Metres</Text>
                      <TextInput
                        className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                        placeholder="22"
                        value={cubicMetreCapacity}
                        onChangeText={setCubicMetreCapacity}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  {/* Notes */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Notes</Text>
                    <TextInput
                      className="w-full h-24 px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                      placeholder="Additional notes..."
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </ScrollView>

              {/* Submit Buttons */}
              <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
                <View className="flex-row space-x-3">
                  <Pressable
                    className="flex-1 h-12 bg-gray-200 rounded-lg items-center justify-center"
                    onPress={onClose}
                  >
                    <Text className="text-gray-700 font-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    className={`flex-[2] h-12 bg-gray-900 rounded-lg items-center justify-center ${
                      createJobMutation.isPending ? 'opacity-50' : 'active:bg-gray-800'
                    }`}
                    onPress={handleSubmit}
                    disabled={createJobMutation.isPending}
                  >
                    <Text className="text-white font-semibold text-base">
                      {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <Modal
            visible={showConfirmation}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowConfirmation(false)}
          >
            <View className="flex-1 bg-black/50 justify-center items-center px-4">
              <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
                <Text className="text-xl font-bold text-gray-900 mb-2">Confirm Job Creation</Text>
                <Text className="text-gray-600 mb-4">
                  Please review the job details before confirming:
                </Text>
                
                <View className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="font-medium text-gray-700">Company:</Text>
                    <Text className="text-gray-900">{pendingData?.companyName}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="font-medium text-gray-700">Rego:</Text>
                    <Text className="text-gray-900">{pendingData?.rego}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="font-medium text-gray-700">Load Number:</Text>
                    <Text className="text-gray-900">1</Text>
                  </View>
                  {pendingData?.materialType && (
                    <View className="flex-row justify-between">
                      <Text className="font-medium text-gray-700">Material:</Text>
                      <Text className="text-gray-900">{pendingData.materialType}</Text>
                    </View>
                  )}
                  {pendingData?.pricePerUnit && (
                    <View className="flex-row justify-between">
                      <Text className="font-medium text-gray-700">Price:</Text>
                      <Text className="text-gray-900">${pendingData.pricePerUnit.toFixed(2)}</Text>
                    </View>
                  )}
                  <View className="flex-row justify-between">
                    <Text className="font-medium text-gray-700">Date:</Text>
                    <Text className="text-gray-900">{format(new Date(), 'PPP')}</Text>
                  </View>
                </View>

                <View className="flex-row space-x-3">
                  <Pressable
                    className="flex-1 h-12 border border-gray-300 rounded-lg items-center justify-center"
                    onPress={() => {
                      setShowConfirmation(false);
                      setPendingData(null);
                    }}
                  >
                    <Text className="text-gray-700 font-medium">Cancel</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 h-12 bg-gray-900 rounded-lg items-center justify-center active:bg-gray-800"
                    onPress={handleConfirmCreate}
                  >
                    <Text className="text-white font-semibold">Confirm</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}