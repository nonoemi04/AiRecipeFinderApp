import React, { useState } from 'react';
import { Text, TouchableOpacity, View, ScrollView, ImageBackground, Alert } from 'react-native';
import { doc, collection, setDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import "../global.css"
import { Recipe } from '../types/recipes';


export default function RecipeScreen({ route }: { route: any }) {

  const [img] = useState(require('../assets/img2.png'));
  const { id, name, duration, ingredients, instructions, liked, firestoreDatabase, onGoBack } = route.params;
  const [localLike, setLocalLike] = useState<boolean>(liked)

  const addToFav = async () => {
    try {
      const favRecipeRef = collection(firestoreDatabase, 'FavRecipes');
      const item: Recipe = {
        id,
        name,
        duration,
        ingredients,
        instructions,
        liked: true,
      };
      await setDoc(doc(favRecipeRef, id), item);
    } catch (error) {
      Alert.alert('Error adding recipes to favorite:', `${error}`, [{ text: 'OK' }])
    }
    if (onGoBack) onGoBack(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-gnd-gray">
      <ScrollView className="flex-1 bg-gnd-gray">
        <ImageBackground
          source={img}
          className="w-full h-96 pb-24"
          resizeMode="contain"
        />

        <View className="pl-6 pr-10">
          <View className="flex-row justify-between items-center mb-2">
            <View className='flex-1 pr-4 mt-16'>
              <Text className="text-2xl font-bold text-black">{name}</Text>
              <Text className="font-semibold text-lg text-black mt-1">{duration.replace('minutes', 'min.')}</Text>
            </View>
            <TouchableOpacity className='mt-20 mr-2'>
              <FontAwesome
                name={localLike ? "heart" : "heart-o"}
                size={24}
                color={localLike == false ? 'black' : 'purple'}
                onPress={() => {
                  if (!localLike) {
                    setLocalLike(true);
                    addToFav();
                  }
                }}
                style={{
                  backgroundColor: '#e3e3e3',
                  borderRadius: 20,
                }}
              />
            </TouchableOpacity>
          </View>

          <Text className="mt-6 text-lg font-semibold text-black mb-1">Ingredients:</Text>
          <View className="mb-4">
            {ingredients.map((item: string, index: number) => (
              <Text key={index} className="font-normal text-lg text-black ml-3">• {item}</Text>
            ))}
          </View>

          <Text className="mt-3 text-lg font-semibold text-black mb-1">Instructions:</Text>
          <View className="mb-4">
            <Text className="font-normal text-lg text-black ml-3">{instructions.join("\n")}</Text>
          </View>



        </View>
      </ScrollView>
    </SafeAreaView>
  );
}