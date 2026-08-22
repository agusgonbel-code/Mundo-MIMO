import { mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const dir=path.join(root,'assets','audio');
const files={
  'dog.ogg':'https://upload.wikimedia.org/wikipedia/commons/4/4c/George_vuf_1996.ogg',
  'cat.ogg':'https://upload.wikimedia.org/wikipedia/commons/6/62/Meow.ogg',
  'cow.ogg':'https://upload.wikimedia.org/wikipedia/commons/a/a5/Single_Cow_Moo.ogg',
  'frog.oga':'https://upload.wikimedia.org/wikipedia/commons/9/9f/Single_Frog_Croak.oga',
  'voice-perro.wav':'https://commons.wikimedia.org/wiki/Special:Redirect/file/LL-Q1321_(spa)-Guergana-perro.wav',
  'voice-vamos.wav':'https://commons.wikimedia.org/wiki/Special:Redirect/file/LL-Q1321_(spa)-Knites-%C2%A1Vamos!.wav',
  'voice-uno.wav':'https://commons.wikimedia.org/wiki/Special:Redirect/file/LL-Q1321_(spa)-Akrit0mythos-uno.wav',
  'voice-dos.wav':'https://commons.wikimedia.org/wiki/Special:Redirect/file/LL-Q1321_(spa)-Guergana-dos.wav',
  'voice-tres.wav':'https://commons.wikimedia.org/wiki/Special:Redirect/file/LL-Q1321_(spa)-Rachlel-tres.wav',
  'voice-estrella.wav':'https://commons.wikimedia.org/wiki/Special:Redirect/file/LL-Q1321_(spa)-Guergana-estrella.wav',
  'voice-pez.wav':'https://commons.wikimedia.org/wiki/Special:Redirect/file/LL-Q1321_(spa)-Guergana-pez.wav',
  'voice-pequeno.wav':'https://commons.wikimedia.org/wiki/Special:Redirect/file/LL-Q1321_(spa)-Guergana-peque%C3%B1o.wav',
  'voice-triste.wav':'https://commons.wikimedia.org/wiki/Special:Redirect/file/LL-Q1321_(spa)-Knites-triste.wav'
};

await mkdir(dir,{recursive:true});
for(const [name,url] of Object.entries(files)){
  const destination=path.join(dir,name);
  let valid=false;
  try{valid=(await stat(destination)).size>100;}catch{}
  if(valid)continue;
  const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'MundoMimoReleaseBuilder/1.0'}});
  if(!response.ok)throw new Error(`No se pudo obtener ${name}: HTTP ${response.status}`);
  const data=Buffer.from(await response.arrayBuffer());
  if(data.length<=100)throw new Error(`Audio inválido o vacío: ${name}`);
  await writeFile(destination,data);
}
console.log(`Audio de release preparado: ${Object.keys(files).length} archivos locales.`);
