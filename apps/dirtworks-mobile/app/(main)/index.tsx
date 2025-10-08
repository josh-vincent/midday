import { View, Text, ScrollView, Pressable, TextInput, RefreshControl, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '../../lib/trpc';
import { Plus, Truck, Search, Calendar, MapPin, Package } from 'lucide-react-native';
import { JobDrawer } from '../../components/JobDrawer';

function getLocalDateString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function GatekeeperScreen() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobDrawerVisible, setJobDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddLoadConfirm, setShowAddLoadConfirm] = useState(false);
  const [pendingLoadEntry, setPendingLoadEntry] = useState<any>(null);
  
  const today = useMemo(() => getLocalDateString(), []);

  // Fetch today's grouped jobs
  const { data: todaysGroupedJobs = [], isLoading, refetch } = useQuery(
    trpc.job.getJobsGroupedByTruckForDate.queryOptions(
      { date: today },
      {
        refetchInterval: 60 * 1000, // Refetch every minute
        refetchOnWindowFocus: false,
      }
    )
  );

  // Add load mutation
  const addLoadMutation = useMutation(
    trpc.job.addLoadWithDirtType.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'trpc' && 
                   queryKey[1] && 
                   queryKey[1].toString().startsWith('job.');
          },
        });
        setPendingLoadEntry(null);
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to add load');
      },
    })
  );

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery) return todaysGroupedJobs;
    
    const searchLower = searchQuery.toLowerCase();
    return todaysGroupedJobs.filter((entry: any) =>
      entry.companyName.toLowerCase().includes(searchLower) ||
      entry.rego.toLowerCase().includes(searchLower)
    );
  }, [todaysGroupedJobs, searchQuery]);

  const handleAddLoadClick = (entry: any) => {
    const materialType = entry.latestJob?.materialType;
    if (!materialType) {
      Alert.alert('Error', 'No material type set for this job');
      return;
    }

    // Set pending entry for confirmation
    setPendingLoadEntry({
      entry,
      materialType,
      newLoadNumber: (entry.maxLoadNumber || entry.totalLoads) + 1,
    });
    setShowAddLoadConfirm(true);
  };

  const handleConfirmAddLoad = async () => {
    if (!pendingLoadEntry) return;
    
    setShowAddLoadConfirm(false);
    
    await addLoadMutation.mutateAsync({
      originalJobId: pendingLoadEntry.entry.latestJob.id,
      date: today,
      dirtType: pendingLoadEntry.materialType,
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#020817" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1">
          {/* Header with Search - Fixed at top */}
          <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="bg-white border border-gray-200 rounded-lg p-3">
              <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2">
                <Search size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-2 text-gray-900"
                  placeholder="Search by customer or rego..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          {/* Today's Entries Section - Takes up 75% of remaining space */}
          <View className="flex-1" style={{ flex: 3 }}>
            <ScrollView 
              className="bg-white"
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              <View className="px-4 py-3 border-b border-gray-200">
                <View className="flex-row items-center">
                  <Truck size={20} color="#020817" />
                  <Text className="text-lg font-semibold ml-2">
                    Today's Entries ({filteredJobs.length})
                  </Text>
                </View>
              </View>

              {filteredJobs.length === 0 ? (
                <View className="flex-1 items-center justify-center py-20">
                  <Truck size={48} color="#9ca3af" />
                  <Text className="text-gray-500 text-lg mt-4">
                    {searchQuery ? 'No entries match your search' : 'No entries for today yet'}
                  </Text>
                  {!searchQuery && (
                    <Text className="text-gray-400 text-sm mt-2">
                      Create your first job entry below
                    </Text>
                  )}
                </View>
              ) : (
                <View className="p-4">
                  {filteredJobs.map((entry: any) => (
                    <View
                      key={`${entry.companyName}-${entry.rego}`}
                      className="bg-white border border-gray-200 rounded-lg p-4 mb-3"
                    >
                      <View className="mb-3">
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center">
                            <Truck size={20} color="#6b7280" />
                            <Text className="text-2xl font-bold text-gray-900 ml-2">
                              {entry.rego}
                            </Text>
                          </View>
                          <View className="bg-gray-100 px-3 py-1.5 rounded-full">
                            <Text className="text-sm font-semibold text-gray-700">
                              {entry.totalLoads} load{entry.totalLoads !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center mt-2">
                          <MapPin size={16} color="#9ca3af" />
                          <Text className="text-base text-gray-700 ml-2 font-medium">
                            {entry.companyName}
                          </Text>
                        </View>
                        {entry.latestJob?.materialType && (
                          <View className="flex-row items-center mt-2">
                            <Package size={16} color="#9ca3af" />
                            <Text className="text-sm text-gray-600 ml-2">
                              Material: {entry.latestJob.materialType}
                            </Text>
                          </View>
                        )}
                        {entry.latestJob?.jobDate && (
                          <View className="flex-row items-center mt-1">
                            <Calendar size={16} color="#9ca3af" />
                            <Text className="text-sm text-gray-600 ml-2">
                              {new Date(entry.latestJob.jobDate).toLocaleDateString()}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <Pressable
                        className={`bg-gray-900 rounded-lg py-3 ${
                          addLoadMutation.isPending || !entry.latestJob?.materialType 
                            ? 'opacity-50' 
                            : 'active:bg-gray-800'
                        }`}
                        onPress={() => handleAddLoadClick(entry)}
                        disabled={addLoadMutation.isPending || !entry.latestJob?.materialType}
                      >
                        <View className="flex-row items-center justify-center">
                          <Plus size={18} color="white" />
                          <Text className="text-white font-semibold ml-2">
                            Add Load
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>

          {/* Bottom - Fixed New Entry Section (25% of height) */}
          <View className="bg-white border-t border-gray-300" style={{ flex: 1, maxHeight: 150 }}>
            <View className="p-4">
              <Text className="text-lg font-semibold mb-3">New Entry</Text>
              <Pressable
                className="bg-gray-900 rounded-lg py-4 active:bg-gray-800"
                onPress={() => setJobDrawerVisible(true)}
              >
                <View className="flex-row items-center justify-center">
                  <Plus size={20} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    Create New Job
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Job Drawer */}
          <JobDrawer
            visible={jobDrawerVisible}
            onClose={() => setJobDrawerVisible(false)}
            onSuccess={() => {
              setJobDrawerVisible(false);
              refetch();
            }}
          />

          {/* Add Load Confirmation Modal */}
          <Modal
            visible={showAddLoadConfirm}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowAddLoadConfirm(false)}
          >
            <View className="flex-1 bg-black/50 justify-center items-center px-4">
              <View className="bg-white rounded-lg p-6 w-full max-w-sm">
                <Text className="text-xl font-semibold mb-2">Confirm Additional Load</Text>
                <Text className="text-gray-600 mb-4">
                  Please review the details for this additional load:
                </Text>
                
                <View className="bg-gray-50 rounded-lg p-4 mb-4">
                  <View className="space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="font-medium">Company:</Text>
                      <Text>{pendingLoadEntry?.entry.companyName}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="font-medium">Rego:</Text>
                      <Text>{pendingLoadEntry?.entry.rego}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="font-medium">Load Number:</Text>
                      <Text>{pendingLoadEntry?.newLoadNumber}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="font-medium">Material:</Text>
                      <Text>{pendingLoadEntry?.materialType}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="font-medium">Date:</Text>
                      <Text>{today}</Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row space-x-3">
                  <Pressable
                    className="flex-1 border border-gray-300 rounded-lg py-3"
                    onPress={() => {
                      setShowAddLoadConfirm(false);
                      setPendingLoadEntry(null);
                    }}
                  >
                    <Text className="text-center text-gray-700 font-medium">Cancel</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 bg-gray-900 rounded-lg py-3 active:bg-gray-800"
                    onPress={handleConfirmAddLoad}
                  >
                    <Text className="text-center text-white font-semibold">
                      Confirm & Add Load
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}