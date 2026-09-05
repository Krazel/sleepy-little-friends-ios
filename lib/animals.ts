import type { AnimalId } from './game';
export type Crop={x:number;y:number;width:number;height:number};
export type Animal={id:AnimalId;name:string;kind:string;color:string;room:Crop;prop:Crop;face:{x:number;y:number};placed:{x:number;y:number;width:number};instructions:[string,string];actionLabels:[string,string];goodnight:string};
export const ANIMALS:Record<AnimalId,Animal>={
 bunny:{id:'bunny',name:'Luna',kind:'la conejita',color:'#f6d9cc',room:{x:0,y:0,width:1024,height:1033},prop:{x:136,y:1076,width:753,height:430},face:{x:.515,y:.49},placed:{x:.51,y:.78,width:.66},instructions:['Ponle la mantita a Luna.','Dale un besito de buenas noches.'],actionLabels:['Arropar a Luna','Dar un besito a Luna'],goodnight:'Buenas noches, Luna. Qué calentita.'},
 kitten:{id:'kitten',name:'Milo',kind:'el gatito',color:'#e8ddef',room:{x:0,y:0,width:1024,height:1167},prop:{x:355,y:1233,width:318,height:235},face:{x:.49,y:.46},placed:{x:.52,y:.66,width:.30},instructions:['Acerca el cojín a Milo.','Toca la estrella y apaga la luz.'],actionLabels:['Dar el cojín a Milo','Apagar la lámpara de Milo'],goodnight:'Buenas noches, Milo. Dulces sueños.'},
 bear:{id:'bear',name:'Nube',kind:'el osito',color:'#dcebe0',room:{x:0,y:0,width:1024,height:1110},prop:{x:340,y:1147,width:343,height:348},face:{x:.515,y:.495},placed:{x:.515,y:.75,width:.31},instructions:['Dale su peluche a Nube.','Toca la música para cantarle una nana.'],actionLabels:['Dar el peluche a Nube','Cantar una nana a Nube'],goodnight:'Buenas noches, Nube. Tu peluche está contigo.'}
};

