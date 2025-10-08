import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '../../lib/trpc';
import { useAuth } from '../../lib/auth';
import * as SecureStore from 'expo-secure-store';
import { ChevronRight } from 'lucide-react-native';

export default function TeamsScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Fetch teams using the correct tRPC query pattern
  const { data: teams = [], isLoading, error } = useQuery(
    trpc.team.list.queryOptions(
      {},
      {
        enabled: !!token,
      }
    )
  );

  // Change team mutation using the correct tRPC mutation pattern
  const changeTeamMutation = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        router.replace('/(main)');
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to select team');
      },
    })
  );

  const handleTeamSelect = async (teamId: string) => {
    setSelectedTeamId(teamId);
    await SecureStore.setItemAsync('selected_team_id', teamId);
    await changeTeamMutation.mutateAsync({ teamId });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#020817" />
          <Text className="text-gray-600 mt-4">Loading teams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-600 text-center">Failed to load teams</Text>
          <Pressable 
            className="mt-4 px-6 py-3 bg-gray-900 rounded-lg"
            onPress={() => queryClient.invalidateQueries({ queryKey: ['trpc', 'team.list'] })}
          >
            <Text className="text-white font-medium">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900">Select Team</Text>
          <Text className="text-gray-500 mt-1">Choose a team to continue</Text>
        </View>

        {/* Teams List */}
        <ScrollView className="flex-1 px-6 py-4">
          {teams.length === 0 ? (
            <View className="bg-white rounded-lg p-6 items-center">
              <Text className="text-gray-600 text-center">
                No teams found. Please contact your administrator.
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {teams.map((team: any) => (
                <Pressable
                  key={team.id}
                  className={`bg-white rounded-lg border ${
                    selectedTeamId === team.id 
                      ? 'border-gray-900' 
                      : 'border-gray-200'
                  } p-4 active:bg-gray-50`}
                  onPress={() => handleTeamSelect(team.id)}
                  disabled={changeTeamMutation.isPending}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      {/* Team Avatar */}
                      <View className="w-12 h-12 bg-gray-200 rounded-lg items-center justify-center mr-4">
                        <Text className="text-xl font-bold text-gray-700">
                          {team.name?.charAt(0)?.toUpperCase() || 'T'}
                        </Text>
                      </View>
                      
                      {/* Team Info */}
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900">
                          {team.name}
                        </Text>
                        {team.description && (
                          <Text className="text-sm text-gray-500 mt-1">
                            {team.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Action Button */}
                    <View className="ml-4">
                      {changeTeamMutation.isPending && selectedTeamId === team.id ? (
                        <ActivityIndicator size="small" color="#020817" />
                      ) : (
                        <Pressable 
                          className="bg-gray-900 px-4 py-2 rounded-lg flex-row items-center"
                          onPress={() => handleTeamSelect(team.id)}
                        >
                          <Text className="text-white font-medium mr-1">Launch</Text>
                          <ChevronRight size={16} color="white" />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}