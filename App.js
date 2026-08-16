import React, {useState} from 'react';
import {SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert} from 'react-native';
import {StatusBar} from 'expo-status-bar';

const games = [
  {id:'pairs', title:'Parejas', emoji:'🧠', color:'#FFD95A', skill:'Memoria'},
  {id:'animals', title:'Animales', emoji:'🦁', color:'#70D6A8', skill:'Escucha'},
  {id:'colors', title:'Colores', emoji:'🌈', color:'#FF8FAB', skill:'Colores'},
  {id:'shapes', title:'Formas', emoji:'🔷', color:'#8BC6FF', skill:'Percepción'},
  {id:'count', title:'Contar', emoji:'🔢', color:'#C9A7FF', skill:'Números'},
  {id:'puzzles', title:'Puzles', emoji:'🧩', color:'#FFB36B', skill:'Lógica'},
];

const pairSet = ['🐶','🐱','🐰','🦊'];
const shuffledPairs = () => [...pairSet, ...pairSet].sort(() => Math.random() - 0.5).map((v,i)=>({id:i,v,open:false,done:false}));

function ParentGate({onClose}) {
  const [answer,setAnswer] = useState(null);
  return <View style={styles.overlay}>
    <View style={styles.parentCard}>
      <Text style={styles.parentTitle}>Zona de familias</Text>
      <Text style={styles.parentText}>Para entrar, toca el número que es mayor.</Text>
      <View style={styles.row}>
        {[3,8,5].map(n=><TouchableOpacity key={n} style={styles.numberButton} onPress={()=>setAnswer(n)}>
          <Text style={styles.numberText}>{n}</Text>
        </TouchableOpacity>)}
      </View>
      {answer===8 ? <>
        <Text style={styles.ok}>✓ Acceso adulto</Text>
        <Text style={styles.parentText}>Aquí irán perfiles, tiempo de juego, progreso, límites y configuración.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onClose}><Text style={styles.primaryText}>Volver</Text></TouchableOpacity>
      </> : answer!==null ? <Text style={styles.try}>Prueba otra vez</Text> : null}
    </View>
  </View>
}

function PairsGame({goBack}) {
  const [cards,setCards] = useState(shuffledPairs());
  const [selected,setSelected] = useState([]);
  const tap = (idx) => {
    if(cards[idx].done || selected.includes(idx) || selected.length===2) return;
    const nextSel=[...selected, idx];
    const next=cards.map((c,i)=>i===idx?{...c,open:true}:c);
    setCards(next); setSelected(nextSel);
    if(nextSel.length===2){
      const [a,b]=nextSel;
      setTimeout(()=>{
        if(next[a].v===next[b].v){
          const solved=next.map((c,i)=>(i===a||i===b)?{...c,done:true}:c);
          setCards(solved);
          if(solved.every(c=>c.done)) setTimeout(()=>Alert.alert('¡Genial!','Has encontrado todas las parejas 🎉'),200);
        } else {
          setCards(next.map((c,i)=>(i===a||i===b)?{...c,open:false}:c));
        }
        setSelected([]);
      },700);
    }
  };
  return <SafeAreaView style={styles.gamePage}>
    <View style={styles.topbar}><TouchableOpacity onPress={goBack}><Text style={styles.back}>←</Text></TouchableOpacity><Text style={styles.gameTitle}>Encuentra las parejas</Text><Text style={styles.mascot}>🐻</Text></View>
    <Text style={styles.instruction}>Busca dos animales iguales</Text>
    <View style={styles.grid}>{cards.map((c,i)=><TouchableOpacity key={c.id} onPress={()=>tap(i)} style={[styles.card,c.done&&styles.doneCard]}>
      <Text style={styles.cardEmoji}>{c.open||c.done?c.v:'⭐'}</Text>
    </TouchableOpacity>)}</View>
  </SafeAreaView>
}

function AnimalsGame({goBack}) {
  const animals=[['🐶','Perro','¡Guau!'],['🐱','Gato','¡Miau!'],['🐮','Vaca','¡Muuu!'],['🦁','León','¡Grrr!']];
  const [current,setCurrent]=useState(0);
  return <SafeAreaView style={styles.gamePage}>
    <View style={styles.topbar}><TouchableOpacity onPress={goBack}><Text style={styles.back}>←</Text></TouchableOpacity><Text style={styles.gameTitle}>Animales y sonidos</Text><Text style={styles.mascot}>🦜</Text></View>
    <View style={styles.bigAnimal}><Text style={styles.hugeEmoji}>{animals[current][0]}</Text><Text style={styles.animalName}>{animals[current][1]}</Text></View>
    <TouchableOpacity style={styles.soundButton} onPress={()=>Alert.alert(animals[current][1],animals[current][2])}><Text style={styles.soundText}>🔊 Escuchar</Text></TouchableOpacity>
    <View style={styles.row}>{animals.map((a,i)=><TouchableOpacity key={a[1]} style={[styles.miniAnimal,current===i&&styles.selectedAnimal]} onPress={()=>setCurrent(i)}><Text style={styles.miniEmoji}>{a[0]}</Text></TouchableOpacity>)}</View>
  </SafeAreaView>
}

function ColorsGame({goBack}) {
  const options=[['Rojo','#FF595E'],['Azul','#1982C4'],['Verde','#8AC926'],['Amarillo','#FFCA3A']];
  const [target,setTarget]=useState(0);
  const choose=(i)=>{
    if(i===target){ Alert.alert('¡Muy bien!','🎉'); setTarget((target+1)%options.length);}
    else Alert.alert('Casi','Busca el color '+options[target][0].toLowerCase());
  };
  return <SafeAreaView style={styles.gamePage}>
    <View style={styles.topbar}><TouchableOpacity onPress={goBack}><Text style={styles.back}>←</Text></TouchableOpacity><Text style={styles.gameTitle}>Los colores</Text><Text style={styles.mascot}>🦄</Text></View>
    <Text style={styles.challenge}>Toca el color {options[target][0]}</Text>
    <View style={styles.colorGrid}>{options.map((o,i)=><TouchableOpacity key={o[0]} onPress={()=>choose(i)} style={[styles.colorCircle,{backgroundColor:o[1]}]}/>)}</View>
  </SafeAreaView>
}

export default function App(){
  const [screen,setScreen]=useState('home');
  const [parent,setParent]=useState(false);
  if(screen==='pairs') return <PairsGame goBack={()=>setScreen('home')}/>;
  if(screen==='animals') return <AnimalsGame goBack={()=>setScreen('home')}/>;
  if(screen==='colors') return <ColorsGame goBack={()=>setScreen('home')}/>;
  return <SafeAreaView style={styles.container}>
    <StatusBar style="dark"/>
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <View><Text style={styles.hello}>¡Hola, explorador!</Text><Text style={styles.subtitle}>¿Qué quieres descubrir hoy?</Text></View>
        <TouchableOpacity onPress={()=>setParent(true)} style={styles.parentIcon}><Text style={{fontSize:24}}>👨‍👩‍👧</Text></TouchableOpacity>
      </View>
      <View style={styles.hero}><Text style={styles.heroMascot}>🐻</Text><View style={{flex:1}}><Text style={styles.heroTitle}>Mundo Mimo</Text><Text style={styles.heroText}>Aprender jugando es una aventura</Text></View></View>
      <Text style={styles.section}>Juegos</Text>
      <View style={styles.games}>{games.map(g=><TouchableOpacity key={g.id} onPress={()=>['pairs','animals','colors'].includes(g.id)?setScreen(g.id):Alert.alert('Muy pronto',g.title+' será uno de los próximos juegos.')} style={[styles.gameTile,{backgroundColor:g.color}]}>
        <Text style={styles.tileEmoji}>{g.emoji}</Text><Text style={styles.tileTitle}>{g.title}</Text><Text style={styles.tileSkill}>{g.skill}</Text>
      </TouchableOpacity>)}</View>
      <View style={styles.calm}><Text style={styles.calmEmoji}>🌿</Text><View style={{flex:1}}><Text style={styles.calmTitle}>Diseñado para aprender con calma</Text><Text style={styles.calmText}>Sin anuncios, sin enlaces externos y sin recompensas agresivas.</Text></View></View>
    </ScrollView>
    {parent && <ParentGate onClose={()=>setParent(false)}/>}
  </SafeAreaView>
}

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:'#FFF9ED'},scroll:{padding:20,paddingBottom:40},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:8,marginBottom:18},
  hello:{fontSize:28,fontWeight:'900',color:'#27304A'},subtitle:{fontSize:16,color:'#65708A',marginTop:4},
  parentIcon:{backgroundColor:'#fff',padding:12,borderRadius:18},
  hero:{backgroundColor:'#7459E8',borderRadius:28,padding:20,flexDirection:'row',alignItems:'center',marginBottom:24},
  heroMascot:{fontSize:72,marginRight:12},heroTitle:{fontSize:30,fontWeight:'900',color:'#fff'},heroText:{fontSize:16,color:'#F0ECFF',marginTop:4},
  section:{fontSize:22,fontWeight:'900',color:'#27304A',marginBottom:12},games:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},
  gameTile:{width:'48%',borderRadius:24,padding:18,marginBottom:14,minHeight:154},tileEmoji:{fontSize:45},tileTitle:{fontSize:21,fontWeight:'900',color:'#27304A',marginTop:8},tileSkill:{fontSize:13,fontWeight:'700',color:'#4A5369',marginTop:3},
  calm:{backgroundColor:'#fff',padding:18,borderRadius:22,flexDirection:'row',marginTop:10},calmEmoji:{fontSize:34,marginRight:12},calmTitle:{fontWeight:'900',fontSize:16,color:'#27304A'},calmText:{color:'#65708A',marginTop:4,lineHeight:19},
  gamePage:{flex:1,backgroundColor:'#FFF9ED',padding:20},topbar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:8},
  back:{fontSize:38,fontWeight:'800',color:'#27304A'},gameTitle:{fontSize:22,fontWeight:'900',color:'#27304A'},mascot:{fontSize:36},instruction:{fontSize:19,color:'#65708A',textAlign:'center',marginVertical:24},
  grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},card:{width:'23%',aspectRatio:.78,backgroundColor:'#7459E8',borderRadius:20,alignItems:'center',justifyContent:'center',marginBottom:10},doneCard:{backgroundColor:'#DDF6E8'},cardEmoji:{fontSize:38},
  bigAnimal:{alignItems:'center',justifyContent:'center',marginTop:45},hugeEmoji:{fontSize:150},animalName:{fontSize:32,fontWeight:'900',color:'#27304A'},soundButton:{backgroundColor:'#7459E8',padding:18,borderRadius:22,alignSelf:'center',marginVertical:28,minWidth:190},soundText:{color:'#fff',fontWeight:'900',fontSize:20},
  row:{flexDirection:'row',justifyContent:'center',gap:10},miniAnimal:{backgroundColor:'#fff',padding:12,borderRadius:18},selectedAnimal:{borderWidth:4,borderColor:'#7459E8'},miniEmoji:{fontSize:40},
  challenge:{fontSize:27,fontWeight:'900',color:'#27304A',textAlign:'center',marginTop:50},colorGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-around',marginTop:40},colorCircle:{width:130,height:130,borderRadius:65,margin:16,borderWidth:8,borderColor:'#fff'},
  overlay:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(39,48,74,.55)',alignItems:'center',justifyContent:'center',padding:24},parentCard:{backgroundColor:'#fff',borderRadius:28,padding:24,width:'100%'},parentTitle:{fontSize:26,fontWeight:'900',color:'#27304A'},parentText:{fontSize:16,color:'#65708A',lineHeight:22,marginVertical:12},numberButton:{backgroundColor:'#F2EFFF',borderRadius:18,padding:18,minWidth:70,alignItems:'center'},numberText:{fontSize:28,fontWeight:'900',color:'#7459E8'},ok:{fontSize:18,fontWeight:'900',color:'#31966A',marginTop:20},try:{fontSize:16,fontWeight:'800',color:'#D45B5B',marginTop:18},primaryButton:{backgroundColor:'#7459E8',padding:16,borderRadius:18,marginTop:12},primaryText:{color:'#fff',fontWeight:'900',fontSize:18,textAlign:'center'}
});
