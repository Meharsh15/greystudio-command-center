import './globals.css';
import type {Metadata,Viewport} from 'next';

export const metadata:Metadata={
  title:'GreyStudio Command Center',
  description:'Private GreyStudio finance, shop, business and life command center'
};

export const viewport:Viewport={
  width:'device-width',
  initialScale:1,
  maximumScale:1,
  userScalable:false
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}