import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, FlatList, ActivityIndicator, Alert } from 'react-native';
import { firebaseApp } from '../init/firebaseConfig';
import { getFirestore, getDocs, doc, collection, deleteDoc, setDoc } from 'firebase/firestore';
import FeatherIcon from 'react-native-vector-icons/Feather';
import EvilIcon from 'react-native-vector-icons/EvilIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import axios from "axios"
import "../global.css"
import { GEMINI_KEY } from "@env"
import { Recipe } from '../types/recipes';
import { BlurView } from 'expo-blur';


export default function MainScreen({ navigation }: { navigation: any }) {

  const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`
  const FIREBASE_FIRESTORE = getFirestore(firebaseApp);
  const [Input, setInput] = useState<string>('');
  const [Typing, setTyping] = useState<boolean>(false);
  const [request, setRequest] = useState<boolean>(false);
  const [likeEvent, setLikeEvent] = useState<boolean>(false);
  const [recipesList, setRecipesList] = useState<Recipe[]>([]);
  const [favRecipeList, setFavRecipeList] = useState<Recipe[]>([]);
  const [dislikedRecipeList, setDislikedRecipeList] = useState<string>('');
  
  useEffect(() => { fetchFavRecipeList(); }, [])

  const createQuery = (option: number): string => {
    fetchFavRecipeList()
    let query = "";
    if (option === 0) {
      setDislikedRecipeList('')
      query = `Give me recipes for ${Input}. Also ommit these ${favRecipeList.map(r => r.name).join(' ,')}`;
      
    } else {
      const disliked = recipesList.filter(recipe => !recipe.liked).map(r => r.name).join(", ");
      let allDisliked = `${dislikedRecipeList}, ${disliked}`
      setDislikedRecipeList(allDisliked)
      query = `I don't like the following recipes: ${allDisliked}. Give me other options for ${Input}. Also ommit these ${favRecipeList.map(r => r.name).join(', ')}`;
    }
    return query
  }

  const sendQuery = async (option: number) => {
    try {
      const requestBody = {
        contents: [{
          parts: [{
            text: `${createQuery(option)} ${Input}. Mention in this order: first the name of the recipe, second its duration(total time), third its ingredients, fourth its instructions and last entry
              of the json is liked:false.
              Mention the step number before each instruction. 
              Fetch me 5 different options. Proivide me the answer as a string that has a json format, with the first key called recipes. Also for each recipe,
              add an "id" key that is the date and time of my request appended by a random number.`
          }
          ]
        }
        ]
      };
      const response = await axios.post(geminiURL, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const modelResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (modelResponse) {
        let cleanModelResponse = modelResponse.replace('```json', '');
        cleanModelResponse = cleanModelResponse.replace('```', '');
        let jsonmodel = JSON.parse(cleanModelResponse)
        setRecipesList(jsonmodel["recipes"])
        setRequest(false)
      }
    } catch (error) {
      Alert.alert('Error information:', `${error}`, [{ text: 'OK' }]);
    }
  }

  const requestGemini = async (option: number) => {
    if (Input != '') {
      setRequest(true)
      sendQuery(option)
    }
  }

  const navigate = ({ item }: { item: Recipe }) => {
    navigation.navigate('recipe', {
      id: item.id, name: item.name, duration: item.duration, ingredients: item.ingredients, instructions: item.instructions, liked: item.liked, firestoreDatabase: FIREBASE_FIRESTORE,
      onGoBack: () => { item.liked = true, setLikeEvent(!likeEvent) }
    })
  }

  const renderRecipeName = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      onPress={() => navigate({ item })}
      className="flex-row items-center justify-between bg-gnd-gray rounded-3xl shadow-sm px-3 py-2 mt-4 mx-auto w-full max-w-[90%] min-h-28"
    >
      <EvilIcon
        name='image'
        size={110}
        color="grey"
        className='mr-2 '
      />
      <View className='flex-1 w-6'>
        <Text numberOfLines={2} ellipsizeMode='tail' className='text-black font-bold text-lg '>{item.name}</Text>
        <Text numberOfLines={1} ellipsizeMode='tail' className='text-black mt-3 text-md '>{item.duration.replace("minutes", 'min.')}</Text>
      </View>

      <TouchableOpacity>
        <AntDesign
          name={item.liked == false ? 'hearto' : 'heart'}
          size={26}
          onPress={() => { setLikeEvent(!likeEvent), item.liked = true; addToFav(item) }}
          color={item.liked == false ? 'black' : 'purple'}
          style={{
            backgroundColor: '#e0e0e0',
            borderRadius: 20,
            padding: 4
          }}>
        </AntDesign>
      </TouchableOpacity>

    </TouchableOpacity>
  );

  const renderFavRecipeName = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      onPress={() => navigate({ item })}
      className="flex-row items-center justify-between bg-gnd-gray rounded-3xl shadow-sm px-3 py-2 mt-4 mx-auto w-full max-w-[90%] min-h-28">
      <EvilIcon
        name='image'
        size={110}
        color="grey"
        className='mr-2'
      />
      <View className='flex-1 w-6'>
        <Text numberOfLines={2} ellipsizeMode='tail' className='mt-3 text-black font-bold text-lg '>{item.name}</Text>
        <Text numberOfLines={1} ellipsizeMode='tail' className='text-black mt-1 text-md '>{item.duration.replace("minutes", 'min.')}</Text>
      </View>

      <TouchableOpacity>
        <AntDesign
          name={'heart'}
          size={26}
          onPress={() => deleteFromFav(item)}
          color={'purple'}
          style={{
            backgroundColor: 'transparent',
            borderRadius: 20,
            padding: 4
          }}>
        </AntDesign>
      </TouchableOpacity>

    </TouchableOpacity>
  );

  const clearRecipeList = () => {
    recipesList.splice(0, recipesList.length)
    fetchFavRecipeList()
    setInput('')
  }

  const fetchFavRecipeList = async () => {
    try {
      const favRecipesRef = collection(FIREBASE_FIRESTORE, "FavRecipes");
      const snapshot = await getDocs(favRecipesRef);

      const recipes: Recipe[] = snapshot.docs.map(doc => ({
        id: doc.data().id,
        name: doc.data().name,
        duration: doc.data().duration,
        ingredients: doc.data().ingredients,
        instructions: doc.data().instructions,
        liked: doc.data().liked
      }));

      setFavRecipeList(recipes)
    } catch (error) {
      Alert.alert('Error fetching favorite recipes:', `${error}`, [{ text: 'OK' }])
    }
  }

  const addToFav = async (item: Recipe) => {
    const favRecipeRef = collection(FIREBASE_FIRESTORE, 'FavRecipes');
    try {
      await setDoc(doc(favRecipeRef, item.id.toString()), item)
    }
    catch (error) {
      Alert.alert('Error adding recipes to favorite:', `${error}`, [{ text: 'OK' }])
    }
  }

  const deleteFromFav = async (item: Recipe) => {
    try {
      const favRecipeRef = collection(FIREBASE_FIRESTORE, 'FavRecipes');
      await deleteDoc(doc(favRecipeRef, item.id.toString()));
      fetchFavRecipeList();
    } catch (error) {
      Alert.alert('Error deleting recipes from favorite:', `${error}`, [{ text: 'OK' }])
    }
  }

  return (
    <View className="flex-1 bg-gnd-gray">

      <View className="mt-24 ml-2 mr-2 px-4 shadow-sm">
        <BlurView intensity={50} tint="dark" className="rounded-full overflow-hidden shadow-xl">
          <View className="flex-row items-center w-full h-16 px-4 bg-gnd-gray rounded-full border-gray-200">
            <TextInput
              value={Input}
              onChangeText={setInput}
              placeholder="What do you feel like eating?"
              placeholderTextColor="#a3a3a3"
              className="flex-1 pl-3 leading-tight text-lg  text-black"
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
              onSubmitEditing={() => requestGemini(0)}
            />
            {!Typing ? (
              <FeatherIcon name="search" size={23} color="black" className="pr-1" />
            ) : (
              <TouchableOpacity onPress={clearRecipeList}>
                <FeatherIcon name="x" size={23} color="black" className="pr-1" />
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
      </View>

      <View className="mt-14 w-full h-full bg-gnd-gray " >
        {request == false && (<Text className="pl-5 text-black font-bold text-4xl "> {recipesList.length == 0 ? "Favorites" : "Suggested recipes"} </Text>)}
        {favRecipeList.length != 0 && request == false && recipesList.length == 0 &&
          (<FlatList
            data={favRecipeList}
            renderItem={renderFavRecipeName}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={true}
            ListFooterComponent={<View className='pb-64'></View>}
          />)}
        {request == false && (<FlatList
          data={recipesList}
          renderItem={renderRecipeName}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          ListFooterComponent={
            <View className='items-center'>
              {recipesList.length != 0 && (
                <TouchableOpacity
                  onPress={() => requestGemini(1)}
                  className="mt-5 h-14 w-48 border-1 items-center bg-my-purple rounded-lg">
                  <Text className="mt-3 font-bold text-lg text-white">I don't like these</Text>
                </TouchableOpacity>)}
            </View>
          }
        />)}
        {request && (
          <View className="mt-64 items-center">
            <ActivityIndicator
              size="large"
              color="#7c3aed" />
          </View>
        )}

      </View>

    </View>);
}
