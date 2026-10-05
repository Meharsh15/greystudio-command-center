import './globals.css';
import type {Metadata} from 'next';

export const metadata:Metadata={
  title:'GreyStudio Command Center',
  description:'Private GreyStudio finance, shop, business and life command center',
  viewport:'width=device-width, initial-scale=1, maximum-scale=1'
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}