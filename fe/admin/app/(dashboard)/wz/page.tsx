import WzComponent from './client';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Client Data",
};

export default function WzPage() {
  return <WzComponent />;
}
