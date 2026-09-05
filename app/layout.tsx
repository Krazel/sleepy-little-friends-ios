import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
 title:'Animalitos a dormir',
 description:'Arropa al conejito, acompaña al gatito y abraza al osito. Un pequeño juego de buenas noches.',
 manifest:'/manifest.webmanifest',
 icons:{icon:'/favicon.svg',apple:'/icon-180.png'},
 appleWebApp:{capable:true,title:'Animalitos',statusBarStyle:'default'},
};
export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#fbf5e9'};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="es"><body>{children}</body></html>;
}
