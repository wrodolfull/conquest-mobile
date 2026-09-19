import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
export function Avatar({name,url,size=88}:{name:string;url:string|null;size?:number}){return <View accessibilityLabel={`${name} avatar`} style={[styles.base,{width:size,height:size,borderRadius:size/2}]}>{url?<Image source={{uri:url}} style={{width:'100%',height:'100%',borderRadius:size/2}}/>:<Text style={[styles.initial,{fontSize:size*.35}]}>{name.trim().slice(0,1).toUpperCase()||'?'}</Text>}</View>}
const styles=StyleSheet.create({base:{alignItems:'center',justifyContent:'center',backgroundColor:'#1B3029',borderWidth:2,borderColor:colors.lime,overflow:'hidden'},initial:{fontWeight:'900',color:colors.lime}});
