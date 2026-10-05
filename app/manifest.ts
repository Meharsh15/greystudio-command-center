import type {MetadataRoute} from 'next';
export default function manifest():MetadataRoute.Manifest{
  return {name:'GreyStudio Command Center',short_name:'GreyStudio',description:'Private GreyStudio finance and business command center',start_url:'/',display:'standalone',background_color:'#07090d',theme_color:'#07090d'};
}